/* ============================================================================
   groups.js — gestion des groupes (liste, ouverture, actions)
   Dépend de globals: API, userId, el, setHeaderTitle, showChat, displayMessage,
   scrollChatToBottom, resolvePP, DEFAULT_PP, window.socket (exposé par socket.js)
============================================================================ */

/* ---------------------------------
   Charger la liste de mes groupes
---------------------------------- */

// Variante "callback" attendue par navigation.js : loadGroups(cb)
function loadGroups(cb) {
  fetch(`${API}/groups/${userId}`)
    .then(res => res.json())
    .then(groups => {
      if (typeof cb === "function") {
        groups.forEach(g => cb(g)); // laisse l’appelant décider (ex: créer la liste)
      } else {
        // fallback : rempli #user-groups-list si présent
        const list = document.getElementById("user-groups-list");
        if (!list) return;
        list.innerHTML = "";
        groups.forEach(g => {
          const div = document.createElement("div");
          div.classList.add("contact-item");
          div.textContent = "💬 " + g.name;
          div.onclick = () => openGroupChat(g.id, g.name);
          list.appendChild(div);
        });
      }
    })
    .catch(err => console.error("[groups] loadGroups:", err));
}

// Version directe (garde pour compat, appelle loadGroups sans cb)
function loadUserGroups() {
  loadGroups(); // remplit #user-groups-list si présent
}

/* ---------------------------------
   Formulaire nouveau groupe
---------------------------------- */

function showNewGroupForm() {
  const content = document.getElementById("tab-content");
  if (!content) return;

  content.innerHTML = `
    <div class="group-form-container">
      <h3>Créer un nouveau groupe</h3>
      <form onsubmit="newGroup(event)" class="group-form">
        <input type="text" id="group-name" placeholder="Nom du groupe" required>
        <div id="group-contact-selection" class="contact-checkbox-list">Chargement des contacts...</div>
        <button type="submit" class="btn-group">Créer</button>
        <p id="group-new-result" class="group-new-result"></p>
      </form>
    </div>
  `;

  // Charger mes contacts
  fetch(`${API}/friends/${userId}`)
    .then(res => res.json())
    .then(friends => {
      const listDiv = document.getElementById("group-contact-selection");
      if (!listDiv) return;
      listDiv.innerHTML = "";

      friends.forEach(f => {
        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.marginBottom = "0.5rem";

        const pp = resolvePP(f.pp) || DEFAULT_PP;

        label.innerHTML = `
          <input type="checkbox" name="group-members" value="${f.id}" style="margin-right: 0.5rem;">
          <div class="pp" style="width:28px;height:28px;border-radius:50%;
               background-image:url('${pp}'); background-size:cover; background-position:center; margin-right: 0.5rem;"></div>
          <span>${f.username}</span>
        `;
        listDiv.appendChild(label);
      });
    })
    .catch(err => {
      console.error("[groups] contacts:", err);
      const listDiv = document.getElementById("group-contact-selection");
      if (listDiv) listDiv.textContent = "Erreur lors du chargement des contacts.";
    });
}

function newGroup(e) {
  e.preventDefault();

  const name = (document.getElementById("group-name")?.value || "").trim();
  const selected = Array.from(document.querySelectorAll('input[name="group-members"]:checked'))
    .map(cb => Number.parseInt(cb.value, 10))
    .filter(Boolean);

  const resultEl = document.getElementById("group-new-result");

  if (!name) {
    if (resultEl) resultEl.textContent = "Nom du groupe requis.";
    return;
  }
  if (selected.length < 2) {
    if (resultEl) resultEl.textContent = "Sélectionne au moins 2 contacts.";
    return;
  }

  fetch(`${API}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, directorId: userId, memberIds: selected })
  })
    .then(res => res.json())
    .then(data => {
      if (resultEl) resultEl.textContent = data.message || "Groupe créé.";
      switchTab?.("groups");
      loadUserGroups(); // rafraîchit la liste
    })
    .catch(err => {
      console.error("[groups] newGroup:", err);
      if (resultEl) resultEl.textContent = "Erreur lors de la création du groupe.";
    });
}

/* ---------------------------------
   Section / affichage groupes
---------------------------------- */

function showGroupSection() {
  document.getElementById("chat-area")?.classList.add("hidden");
  switchTab?.("groups");
}

/* ---------------------------------
   Ouvrir un groupe (chat)
---------------------------------- */

function openGroupChat(groupId, groupName) {
  // État courant
  groupId = Number.parseInt(groupId, 10);
  window.activeGroupId = groupId;
  activeGroupId = groupId;
  activeContactId = null;
  window.activeContactId = null;

  // Rejoindre la room socket (si dispo)
  window.socket?.emit?.("joinGroup", groupId);

  // Titre + zones visibles
  setHeaderTitle(`[Groupe] ${groupName || ""}`);
  showChat(); // affiche la zone de chat ; cache la liste discussions

  // Nettoyage du chat
  const chatBodyEl = el.chatBody() || document.getElementById("chat-body");
  if (chatBodyEl) chatBodyEl.innerHTML = "";

  // Historique des messages du groupe
  fetch(`${API}/group-messages/${groupId}`)
    .then(res => res.json())
    .then(messages => {
      const body = el.chatBody() || document.getElementById("chat-body");
      if (!body) return;

      body.innerHTML = "";
      messages.forEach(m => {
        displayMessage({
          senderId:        m.sender_id,
          content:         m.content,
          sender_pp:       resolvePP(m.sender_pp) || DEFAULT_PP,
          sender_username: m.sender_username
        });
      });
      scrollChatToBottom({ smooth: false });
    })
    .catch(err => console.error("[groups] history:", err));

  // IMPORTANT : ne pas overrider onsubmit ici.
  // L’envoi passe par bindSendForm() (déjà appelé par discussions.js / main.js)
  // qui, si activeGroupId est défini, émettra 'groupMessage' via window.socket.

  // Panneau membres (profil à droite)
  fetch(`${API}/groups/${groupId}/members`)
    .then(res => res.json())
    .then(members => {
      const profile = document.getElementById("contact-profile");
      if (!profile) return;

      profile.innerHTML = `
        <h4>Membres du groupe</h4>
        <ul class="group-members-list"></ul>
      `;
      const list = profile.querySelector(".group-members-list");
      members.forEach(m => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.marginBottom = "0.75rem";

        const pp = resolvePP(m.pp) || DEFAULT_PP;
        li.innerHTML = `
          <div class="pp" style="width:32px;height:32px;border-radius:50%;
               background-image:url('${pp}'); background-size:cover; background-position:center; margin-right:0.75rem;"></div>
          <div>
            <strong>${m.username}</strong><br>
            <span style="font-size: 0.85rem; color: #aaa;">${m.description || "Aucune description"}</span>
          </div>
        `;
        list.appendChild(li);
      });
    })
    .catch(err => console.error("[groups] members:", err));
}

/* ---------------------------------
   Actions groupe (rename/remove/quit/delete)
---------------------------------- */

function changeGroupName(groupId) {
  const newName = prompt("Nouveau nom du groupe :");
  if (!newName) return;

  fetch(`${API}/groups/${groupId}/rename`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName })
  })
    .then(res => res.json())
    .then(() => openGroupChat(groupId, newName))
    .catch(() => alert("Erreur lors du renommage"));
}

function removeMemberPrompt(groupId) {
  const uname = prompt("Nom d'utilisateur à retirer :");
  if (!uname) return;

  fetch(`${API}/groups/${groupId}/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: uname })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Membre retiré");
      openGroupChat(groupId, document.getElementById("chat-user")?.textContent?.replace(/^\[Groupe\]\s*/, "") || "");
    })
    .catch(() => alert("Erreur lors du retrait"));
}

function quitGroup(groupId) {
  if (!confirm("Tu es sûr de vouloir quitter ce groupe ?")) return;

  fetch(`${API}/groups/${groupId}/quit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  })
    .then(res => res.json())
    .then(() => {
      alert("Tu as quitté le groupe.");
      location.reload();
    })
    .catch(() => alert("Erreur"));
}

function deleteGroup(groupId) {
  if (!confirm("Supprimer ce groupe ?")) return;

  fetch(`${API}/groups/${groupId}/delete`, { method: "DELETE" })
    .then(res => res.json())
    .then(() => {
      alert("Groupe supprimé.");
      location.reload();
    })
    .catch(() => alert("Erreur"));
}

/* ---------------------------------
   Exports globaux (utilisés ailleurs)
---------------------------------- */
window.loadGroups        = loadGroups;
window.loadUserGroups    = loadUserGroups;
window.showNewGroupForm  = showNewGroupForm;
window.showGroupSection  = showGroupSection;
window.openGroupChat     = openGroupChat;
window.newGroup          = newGroup;
window.changeGroupName   = changeGroupName;
window.removeMemberPrompt= removeMemberPrompt;
window.quitGroup         = quitGroup;
window.deleteGroup       = deleteGroup;

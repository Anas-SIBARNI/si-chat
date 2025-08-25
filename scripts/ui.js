/* ============================================================================
   ui.js — UI des onglets Contacts & bascules d’affichage
   Rôle: switchTab (pending/add/online/groups/all), show/hide contact section,
         menus profil/réglages
   Dépend de: window.API (ou API_BASE), userId en localStorage, resolvePP (optionnel),
             loadUserGroups(), showNewGroupForm() côté groups.js
============================================================================ */

/* Base API */
const UI_API = window.API || window.API_BASE || "/api";

/* Helpers */
const getUID = () => Number.parseInt(window.userId || localStorage.getItem("userId") || "0", 10);
const safePP = (url) => (typeof window.resolvePP === "function" ? window.resolvePP(url) : (url || "../img/default.jpg"));

/* ---------------------------------
   Switch onglet Contacts
---------------------------------- */
function switchTab(tab) {
  // nav visuelle
  document.querySelectorAll(".tabs .nav button").forEach(btn => btn.classList.remove("active"));
  const tabBtn = document.getElementById(`tab-${tab}`);
  if (tabBtn) tabBtn.classList.add("active");

  // conteneur
  const content = document.getElementById("tab-content");
  if (!content) return;
  content.innerHTML = "";

  const uid = getUID();

  if (tab === "pending") {
    // Demandes en attente
    fetch(`${UI_API}/friend-requests/${uid}`)
      .then(res => res.json())
      .then(requests => {
        content.innerHTML = "";
        (requests || []).forEach(req => {
          const pp = safePP(req.sender_pp);
          const div = document.createElement("div");
          div.classList.add("pending-item");
          div.innerHTML = `
            <div class="pp" style="background-image:url('${pp}'); background-size:cover; background-position:center;"></div>
            <span>${req.sender_username}</span>
            <div style="margin-left:auto;">
              <button onclick="repondreDemande(${req.id}, 'accepte')">✔️</button>
              <button onclick="repondreDemande(${req.id}, 'refuse')">❌</button>
            </div>
          `;
          content.appendChild(div);
        });
      })
      .catch(err => {
        console.error("[ui] pending:", err);
        content.textContent = "Erreur de chargement.";
      });

  } else if (tab === "add") {
    // Ajouter un contact
    content.innerHTML = `
      <div class="add-contact-container">
        <form class="form-inline" onsubmit="addContact(event)">
          <input type="text" id="new-contact" placeholder="Nom d'utilisateur à ajouter..." required>
          <button type="submit">Ajouter</button>
        </form>
        <p id="add-result" class="add-result-message"></p>
      </div>
    `;

  } else if (tab === "online") {
    // Amis en ligne
    fetch(`${UI_API}/friends-online/${uid}`)
      .then(res => res.json())
      .then(friends => {
        const html = (friends || []).map(f => `
          <li>
            <div class="pp" style="background-image:url('${safePP(f.pp)}'); background-size:cover; background-position:center;"></div>
            ${f.username}
          </li>`).join("");
        content.innerHTML = `<ul>${html}</ul>`;
      })
      .catch(err => {
        console.error("[ui] online:", err);
        content.textContent = "Erreur de chargement.";
      });

  } else if (tab === "groups") {
    // Mes groupes
    content.innerHTML = `
      <button class="btn-new-group" onclick="showNewGroupForm()">➕ Nouveau groupe</button>
      <div id="user-groups-list"></div>
    `;
    // charge via groups.js (fallback si absent)
    if (typeof window.loadUserGroups === "function") {
      window.loadUserGroups();
    } else {
      document.getElementById("user-groups-list").textContent = "Module groupes indisponible.";
    }

  } else {
    // Par défaut: liste des amis
    fetch(`${UI_API}/friends/${uid}`)
      .then(res => res.json())
      .then(friends => {
        const html = (friends || []).map(f => `
          <li>
            <div class="pp" style="background-image:url('${safePP(f.pp)}'); background-size:cover; background-position:center;"></div>
            ${f.username}
          </li>`).join("");
        content.innerHTML = `<ul>${html}</ul>`;
      })
      .catch(err => {
        console.error("[ui] friends:", err);
        content.textContent = "Erreur de chargement.";
      });
  }
}

/* ---------------------------------
   Menus (profil / réglages)
---------------------------------- */
function toggleProfileMenu() {
  document.getElementById("profile-menu")?.classList.toggle("hidden");
}
function toggleSettingsMenu() {
  document.getElementById("settings-menu")?.classList.toggle("hidden");
}

/* ---------------------------------
   Sections (Contacts vs Chat)
---------------------------------- */
function showContactSection() {
  // cacher zone discussions + chat
  document.getElementById("discussions-section")?.classList.add("hidden");
  document.getElementById("profile-panel")?.classList.add("hidden");
  document.querySelector(".chat-header")?.classList.add("hidden");
  document.querySelector(".chat-body")?.classList.add("hidden");
  document.querySelector(".chat-footer")?.classList.add("hidden");

  // afficher Contacts
  document.getElementById("contacts-section")?.classList.remove("hidden");
}

function hideContactSection() {
  // cacher Contacts
  document.getElementById("contacts-section")?.classList.add("hidden");

  // ré‑afficher discussions + chat
  document.getElementById("discussions-section")?.classList.remove("hidden");
  document.getElementById("profile-panel")?.classList.remove("hidden");
  document.querySelector(".chat-header")?.classList.remove("hidden");
  document.querySelector(".chat-body")?.classList.remove("hidden");
  document.querySelector(".chat-footer")?.classList.remove("hidden");
}

/* ---------------------------------
   Exports globaux (appel depuis HTML)
---------------------------------- */
window.switchTab           = switchTab;
window.toggleProfileMenu   = toggleProfileMenu;
window.toggleSettingsMenu  = toggleSettingsMenu;
window.showContactSection  = showContactSection;
window.hideContactSection  = hideContactSection;

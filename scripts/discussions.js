/* ============================================================================
   discussions.js — ouverture DM + profil + historique
   Dépend de globals fournis par main.js : API, userId, username, el,
   DEFAULT_PP, userCache, resolvePP, setHeaderTitle, showChat,
   displayMessage, scrollChatToBottom, bindSendForm
============================================================================ */

/* ---------------------------------
   Profil utilisateur (cache)
---------------------------------- */

// Profil par id (avec cache + normalisation pp)
async function getUserProfileSafe(id) {
  try {
    id = Number.parseInt(id, 10);
    if (userCache.has(id)) return userCache.get(id);

    const res = await fetch(`${API}/user/${id}`);
    if (!res.ok) throw new Error("not ok");

    const data = await res.json();
    const profile = {
      id:          data.id,
      username:    data.username,
      pp:          resolvePP(data.pp) || DEFAULT_PP,
      description: data.description || ""
    };

    userCache.set(id, profile);
    return profile;
  } catch {
    return null; // fallback silencieux
  }
}

// Précharger mon profil dans le cache
async function preloadSelfProfile() {
  const me = await getUserProfileSafe(userId);
  if (me) userCache.set(userId, me);
  else    userCache.set(userId, { id: userId, username, pp: DEFAULT_PP });
}

/* ---------------------------------
   Ouvrir une discussion privée
---------------------------------- */

async function loadPrivateDiscussion(contactId, contactName) {
  // État courant (DM actif, pas de groupe)
  activeGroupId   = null;
  activeContactId = Number.parseInt(contactId, 10);
  window.activeGroupId   = null;
  window.activeContactId = activeContactId;

  // Titre + affichage
  setHeaderTitle(contactName || "Discussion privée");
  showChat();

  // Reset du corps du chat
  const body = el.chatBody();
  if (body) body.innerHTML = "";

  // Token anti course (si on change vite de contact)
  const openedId = activeContactId;

  /* ----- Panneau profil (droite) ----- */
  try {
    const panel = document.getElementById("profile-panel");
    if (panel) {
      const nameEl = document.getElementById("profile-name");
      const descEl = document.getElementById("profile-description");
      const ppDiv  = document.getElementById("profile-pp");

      // État “chargement”
      if (nameEl) nameEl.textContent = contactName || "";
      if (descEl) descEl.textContent = "Chargement…";
      if (ppDiv)  ppDiv.style.backgroundImage = "none";

      const p = await getUserProfileSafe(activeContactId);

      if (openedId !== activeContactId) return; // abandon si l’utilisateur a changé de DM

      if (p) {
        if (nameEl) nameEl.textContent = p.username || "";
        if (descEl) descEl.textContent = p.description || "Aucune description";
        if (ppDiv)  ppDiv.style.backgroundImage = `url('${p.pp}')`;
      } else {
        if (nameEl) nameEl.textContent = "Profil introuvable";
        if (descEl) descEl.textContent = "";
      }
    }
  } catch (e) {
    console.error("[discussions] profile-panel:", e);
  }

  /* ----- Historique ----- */
  try {
    const res = await fetch(`${API}/private-messages?user1=${userId}&user2=${activeContactId}`);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const list = await res.json();

    // Préfetch profils présents dans l’historique
    const ids = new Set(list.map(m => m.sender_id).filter(Boolean));
    await Promise.all([...ids].map(getUserProfileSafe));

    if (openedId !== activeContactId) return;

    // Rendu des messages
    list.forEach(m => displayMessage({
      senderId:        m.sender_id,
      content:         m.content,
      sender_pp:       m.sender_pp,       // si fourni par le backend
      sender_username: m.sender_username  // idem
    }));

    // Scroll bas (sans animation pour l’historique)
    scrollChatToBottom({ smooth: false });

    // Activer l’envoi (remplace proprement l’ancien handler)
    bindSendForm();
  } catch (err) {
    console.error("[discussions] historique:", err);
  }
}

/* ---------------------------------
   Sélection d’un contact (événement)
---------------------------------- */

// Garde-fou : s’assurer qu’un conteneur global existe
if (typeof window.currentDM === "undefined") {
  window.currentDM = null;
}

// Ouvre la DM quand un contact est sélectionné
window.addEventListener("contact:selected", async (e) => {
  const { contactId, username, pp } = e.detail || {};

  // Mémorise l’état DM au global (utilisé par l’envoi)
  window.currentDM = { contactId, username, pp };

  // Titre centralisé
  setHeaderTitle(username || "Discussion privée");

  // Ouvre la discussion (ordre: id, nom)
  try {
    await loadPrivateDiscussion(contactId, username);
  } catch (err) {
    console.error("[discussions] loadPrivateDiscussion:", err);
  }
});

/* ---------------------------------
   Exports globaux (utilisés par main.js)
---------------------------------- */
window.loadPrivateDiscussion = loadPrivateDiscussion;
window.preloadSelfProfile   = preloadSelfProfile;

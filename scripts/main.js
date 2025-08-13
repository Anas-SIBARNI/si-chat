/* ============================
   Variables & état global
============================ */
const userId   = localStorage.getItem("userId");
window.userId = userId; // <-- expose pour les autres scripts (UI, contacts, groups)

const username = localStorage.getItem("username");

let activeGroupId   = null;
let activeContactId = null;

window.activeContactId = null;
window.activeGroupId   = null;

// Petit cache { userId -> { username, pp } } pour éviter de refetcher
const userCache = new Map();

// Placeholder d’image si pas de PP fournie
const DEFAULT_PP = "img/default.jpg"; // adapte si ton chemin est différent

/* ============================
   initialisation
============================ */
if (!userId || !username) {
  alert("Veuillez vous connecter.");
  window.location.href = "login.html";
}

// Affichage du nom dans l’UI
const usernameEl = document.getElementById("username");
if (usernameEl) usernameEl.textContent = username;

// Précharge mon profil (PP)
preloadSelfProfile();

/* ============================
   Helpers UI
============================ */
// Renvoie true si l’utilisateur est proche du bas (permet de ne pas forcer le scroll si la personne remonte l’historique)
function isNearBottom(el, threshold = 80) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
}

// Scroll en bas (option smooth)
function scrollChatToBottom({ smooth = true } = {}) {
  const chatBody = document.getElementById("chat-body");
  if (!chatBody) return;
  // Utilise requestAnimationFrame pour laisser le DOM finir de se peindre
  requestAnimationFrame(() => {
    chatBody.scrollTo({
      top: chatBody.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  });
}

/* ============================
   Chargement contacts & écran
============================ */
/* ------- Boot UI: affiche la colonne contacts et charge la liste ------- */
function bootUI() {
  const chatUserEl = document.getElementById("chat-user");
  if (chatUserEl) chatUserEl.textContent = "Discussion privée la plus récente";

  // Au démarrage : on montre les contacts, on cache le chat
  document.getElementById("contact-section")?.classList.remove("hidden");
  document.getElementById("chat-area")?.classList.add("hidden");

  if (typeof loadContacts === "function") {
    console.debug("[bootUI] loadContacts() trouvé -> appel");
    loadContacts();
  } else {
    console.debug("[bootUI] loadContacts() absent -> fallback local");
    fallbackLoadContacts();
  }

  // Sécurité : lier immédiatement le formulaire s'il est déjà dans le DOM
  document.getElementById("chat-form")?.addEventListener("submit", sendMessage);
}

// Démarrer après que TOUT soit chargé (HTML + autres scripts)
window.addEventListener("load", bootUI);

// Sécurité : si contacts.js arrive un peu après, on retente ~2s
let _contactsRetry = 0;
const _contactsTimer = setInterval(() => {
  if (typeof loadContacts === "function") {
    clearInterval(_contactsTimer);
    if (_contactsRetry > 0) {
      console.debug("[bootUI] loadContacts() enfin dispo -> appel tardif");
      loadContacts();
    }
  } else if (++_contactsRetry > 20) { // ~2s
    clearInterval(_contactsTimer);
  }
}, 100);

/* --------- Fallback: charge les amis si contacts.js n'est pas dispo --------- */
function ensureDiscussionsContainer() {
  // 1) Ids probables
  let el =
    document.getElementById("discussions-list") ||
    document.getElementById("contacts-list") ||
    document.getElementById("conversations-list");

  if (el) return el;

  // 2) À défaut, crée sous le titre "Discussions"
  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4"));
  const host = headings.find(h => /discussions/i.test(h.textContent))?.parentElement;

  if (host) {
    el = document.createElement("div");
    el.id = "discussions-list";
    host.appendChild(el);
    return el;
  }

  // 3) Dernier recours : la sidebar
  const sidebar = document.querySelector(".contacts") || document.querySelector(".sidebar") || document.body;
  el = document.createElement("div");
  el.id = "discussions-list";
  sidebar.appendChild(el);
  return el;
}

async function fallbackLoadContacts() {
  try {
    const listEl = ensureDiscussionsContainer();
    listEl.innerHTML = `<div style="padding:.6rem;color:#9aa3b2">Chargement…</div>`;

    const res = await fetch(`http://localhost:3001/friends/${userId}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const friends = await res.json();

    listEl.innerHTML = "";
    if (!Array.isArray(friends) || friends.length === 0) {
      listEl.innerHTML = `<div style="padding:.8rem;color:#9aa3b2">Aucun contact pour le moment</div>`;
      return;
    }

    friends.forEach((f) => {
      const item = document.createElement("div");
      item.className = "contact-item";
      item.style.cssText =
        "display:flex;align-items:center;gap:.6rem;padding:.6rem 1rem;cursor:pointer;border-radius:10px;";
      const pp = (f.pp || "img/default.jpg").replace(/"/g, "&quot;");
      const name = String(f.username || "").replace(/</g, "&lt;");

      item.innerHTML = `
        <div class="pp" style="
          width:40px;height:40px;border-radius:50%;
          background-size:cover;background-position:center;
          background-image:url('${pp}');
        "></div>
        <div style="display:flex;flex-direction:column;">
          <div style="color:#fff;font-weight:600">${name}</div>
          <div style="color:#9aa3b2;font-size:.85rem">Hors ligne</div>
        </div>
      `;

      item.addEventListener("click", () => {
        activeContactId = f.id;
        window.activeContactId = f.id;
        loadPrivateDiscussion(f.id, f.username || "Contact");
        document.getElementById("contact-section")?.classList.add("hidden");
        document.getElementById("chat-area")?.classList.remove("hidden");
      });

      item.addEventListener("mouseenter", () => item.style.background = "rgba(255,255,255,0.05)");
      item.addEventListener("mouseleave", () => item.style.background = "transparent");

      listEl.appendChild(item);
    });
  } catch (err) {
    console.error("fallbackLoadContacts() erreur:", err);
    const listEl = ensureDiscussionsContainer();
    listEl.innerHTML = `<div style="padding:.8rem;color:#ef4444">Impossible de charger les contacts</div>`;
  }
}


/* ============================
   Socket.IO
============================ */
const socket = io("http://localhost:3001");

// S’enregistrer côté serveur dans une room dédiée
socket.emit("registerUser", userId);
console.log("✅ registerUser envoyé pour", userId);

// Réception d’un message privé en live
socket.on("privateMessage", async (data) => {
  console.log("🔔 message privé reçu via socket:", data);

  // Si le chat actif correspond, on affiche
  const isForActiveChat =
    parseInt(window.activeContactId) === data.senderId ||
    parseInt(window.activeContactId) === data.receiverId;

  // Enrichit PP si manquante
  if (!data.sender_pp) {
    const u = await getUserProfileSafe(data.senderId);
    if (u?.pp) data.sender_pp = u.pp;
  }

  if (isForActiveChat) {
    const chatBody = document.getElementById("chat-body");
    const shouldStick = isNearBottom(chatBody);
    displayMessage(data);
    if (shouldStick || data.senderId == userId) scrollChatToBottom();
  } else {
    // Si je suis destinataire et que ce n’est pas la discussion ouverte, on ouvre automatiquement
    if (parseInt(userId) === data.receiverId && parseInt(window.activeContactId) !== data.senderId) {
      await loadPrivateDiscussion(data.senderId, data.sender);
      document.getElementById("contact-section")?.classList.add("hidden");
      document.getElementById("chat-area")?.classList.remove("hidden");
    }
  }
});

// Réception d’un message de groupe
socket.on("groupMessage", async (data) => {
  console.log("🔔 message de groupe reçu via socket :", data);
  if (parseInt(window.activeGroupId) !== data.groupId) return;

  if (!data.sender_pp) {
    const u = await getUserProfileSafe(data.senderId);
    if (u?.pp) data.sender_pp = u.pp;
  }

  const chatBody = document.getElementById("chat-body");
  const shouldStick = isNearBottom(chatBody);
  displayMessage(data);
  if (shouldStick || data.senderId == userId) scrollChatToBottom();
});

/* ============================
   Envoi d’un message
============================ */
function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById("message-input");
  if (!input) return;

  const content = input.value.trim();
  if (!content) return;

  if (activeContactId) {
    // Message privé
    socket.emit("privateMessage", {
      senderId: parseInt(userId),
      receiverId: parseInt(activeContactId),
      content,
      timestamp: new Date().toISOString(),
      sender: username,                     // pour l’affichage
      sender_pp: userCache.get(+userId)?.pp // on envoie aussi ma PP pour accélérer côté récepteur
    });
  } else if (activeGroupId) {
    // Message groupe
    socket.emit("groupMessage", {
      senderId: parseInt(userId),
      groupId: parseInt(activeGroupId),
      content,
      timestamp: new Date().toISOString(),
      sender: username,
      sender_pp: userCache.get(+userId)?.pp
    });
  }

  input.value = "";
}

/* ============================
   Affichage d’un message (DOM)
============================ */
function displayMessage(data) {
  const chatBody = document.getElementById("chat-body");
  if (!chatBody) return;

  const mine = String(data.senderId) === String(userId);
  const wrapper = document.createElement("div");
  wrapper.classList.add("chat-message", mine ? "me" : "other");

  // Détermine l’URL PP (live: data.sender_pp; historique: m.sender_pp; fallback cache/DEFAULT_PP)
  const ppUrl =
    data.sender_pp ||
    data.pp || // backup si un autre nom est déjà utilisé dans tes autres fonctions
    userCache.get(+data.senderId)?.pp ||
    DEFAULT_PP;

  // Bulle
  wrapper.innerHTML = `
    <div class="pp-message" style="background-image:url('${escapeHtml(ppUrl)}');"></div>
    <div class="text-block">
      <div class="sender-line">${escapeHtml(data.sender || "")}${data.sender ? " :" : ""}</div>
      <div class="content-line">${escapeHtml(data.content)}</div>
    </div>
  `;

  chatBody.appendChild(wrapper);
}

/* ============================
   Ouvrir un privé & charger l’historique
============================ */
async function loadPrivateDiscussion(contactId, contactName) {
  activeGroupId = null;
  activeContactId = contactId;
  window.activeGroupId = null;
  window.activeContactId = contactId;

  // Titre
  const chatUserEl = document.getElementById("chat-user");
  if (chatUserEl) chatUserEl.textContent = contactName;

  // Switch d’écran
  document.getElementById("contact-section")?.classList.add("hidden");
  document.getElementById("chat-area")?.classList.remove("hidden");

  // Historique
  const chatBody = document.getElementById("chat-body");
  if (chatBody) chatBody.innerHTML = "";

  try {
    // ⚠️ Backend: /private-messages?user1=..&user2=..
    const res  = await fetch(`http://localhost:3001/private-messages?user1=${userId}&user2=${contactId}`);
    const list = await res.json();

    // Hydrate le cache minimal pour ces expéditeurs
    for (const m of list) {
      if (m.sender_id && (m.sender_username || m.sender_pp)) {
        userCache.set(+m.sender_id, {
          username: m.sender_username || userCache.get(+m.sender_id)?.username || "",
          pp: m.sender_pp || userCache.get(+m.sender_id)?.pp || DEFAULT_PP
        });
      }
    }

    // Rendu de l’historique
    for (const m of list) {
      displayMessage({
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        content: m.content,
        timestamp: m.sent_at,
        sender: m.sender_username,
        sender_pp: m.sender_pp
      });
    }

    // ✅ Auto-scroll au bas après chargement initial (sans animation pour ne pas « secouer »)
    scrollChatToBottom({ smooth: false });

    // Binder l’envoi du message sur ce chat
    const form = document.getElementById("chat-form");
    if (form) {
      form.onsubmit = sendMessage;
    }
  } catch (err) {
    console.error("Erreur chargement messages privés :", err);
  }
}

/* ============================
   Groupes (ouverture — historique)
============================ */
async function openGroupChat(groupId, groupName) {
  activeContactId = null;
  activeGroupId   = groupId;
  window.activeContactId = null;
  window.activeGroupId   = groupId;

  socket.emit("joinGroup", groupId);

  // Titre
  const chatUserEl = document.getElementById("chat-user");
  if (chatUserEl) chatUserEl.textContent = `[Groupe] ${groupName}`;

  // Switch d’écran
  document.getElementById("contact-section")?.classList.add("hidden");
  document.getElementById("chat-area")?.classList.remove("hidden");

  // Historique
  const chatBody = document.getElementById("chat-body");
  if (chatBody) chatBody.innerHTML = "";

  try {
    const res  = await fetch(`http://localhost:3001/group-messages/${groupId}`);
    const list = await res.json();

    for (const m of list) {
      // Hydrate un peu le cache
      if (m.sender_id) {
        userCache.set(+m.sender_id, {
          username: m.sender_username || userCache.get(+m.sender_id)?.username || "",
          pp: m.sender_pp || userCache.get(+m.sender_id)?.pp || DEFAULT_PP
        });
      }

      displayMessage({
        senderId: m.sender_id,
        groupId: m.group_id,
        content: m.content,
        timestamp: m.sent_at,
        sender: m.sender_username,
        sender_pp: m.sender_pp
      });
    }

    // Auto-scroll initial
    scrollChatToBottom({ smooth: false });

    // Binder l’envoi pour ce groupe
    const form = document.getElementById("chat-form");
    if (form) form.onsubmit = sendMessage;
  } catch (err) {
    console.error("Erreur chargement messages groupe :", err);
  }
}

/* ============================
   Profils & cache
============================ */
async function preloadSelfProfile() {
  const me = await getUserProfileSafe(userId);
  if (me) {
    userCache.set(+userId, { username: me.username || username, pp: me.pp || DEFAULT_PP });
  } else {
    userCache.set(+userId, { username, pp: DEFAULT_PP });
  }
}

async function getUserProfileSafe(id) {
  try {
    id = parseInt(id);
    if (userCache.has(id)) return userCache.get(id);

    const res = await fetch(`http://localhost:3001/user/${id}`);
    if (!res.ok) throw new Error("not ok");
    const data = await res.json();

    const profile = {
      id: data.id,
      username: data.username,
      pp: data.pp || DEFAULT_PP,
      description: data.description || ""
    };
    userCache.set(id, profile);
    return profile;
  } catch {
    return null;
  }
}

/* ============================
   Utils
============================ */
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Rendre certaines fonctions globales si elles sont appelées ailleurs
window.sendMessage = sendMessage;
window.loadPrivateDiscussion = loadPrivateDiscussion;
window.openGroupChat = openGroupChat;

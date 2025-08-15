
/* =====================================================
   main.js — cœur de l'app
   - Navigation (Messages / Groupes / Contacts / Paramètres)
   - Messagerie privée (historique + temps réel Socket.IO)
   - Messagerie de groupe (historique + temps réel)
   - Intégration avec les scripts contacts.js / groups.js / ui.js
   - Ouverture automatique de la 1ʳᵉ discussion quand on clique « Messages »
   - Raccourcis robustes pour les sélecteurs du DOM (tolère variations d'IDs)
   - Conserve l’API REST de serveur_auth.js
===================================================== */

/* ------------------------
   Contexte / constantes
------------------------ */
(function () {
  const API = "http://localhost:3001";

  // Utilisateur courant
  const userId   = parseInt(localStorage.getItem("userId") || "0", 10);
  const username = localStorage.getItem("username") || "Moi";

  if (!userId) {
    console.warn("[main] Aucun userId dans localStorage — redirection possible vers login.html");
  }

  /* ------------------------
     Sélecteurs (robustes)
  ------------------------ */
  const el = {
    // Zones
    sidebar:      () => document.querySelector(".sidebar") || document.getElementById("sidebar"),
    contactPanel: () => document.getElementById("contact-section") || document.querySelector(".contacts-panel"),
    chatArea:     () => document.getElementById("chat-area") || document.querySelector(".chat-area") || document.querySelector(".chat"),

    // Chat
    chatHeader:   () => document.getElementById("chat-user") || document.querySelector(".chat-header .title") || document.querySelector(".chat-header"),
    chatBody:     () => document.getElementById("chat-body") || document.querySelector(".chat-body"),
    messageForm:  () => document.getElementById("message-form") || document.querySelector(".chat-footer form") || document.querySelector("#chat-form"),
    messageInput: () => document.getElementById("message-input") || document.querySelector(".chat-footer input, #chat-form input"),

    // Nav
    btnMessages:  () => document.getElementById("btn-messages") || document.querySelector('[data-nav="messages"]') || document.querySelector(".nav-messages"),
    btnGroups:    () => document.getElementById("btn-groups")   || document.querySelector('[data-nav="groups"]')   || document.querySelector(".nav-groups"),
    btnContacts:  () => document.getElementById("btn-contacts") || document.querySelector('[data-nav="contacts"]') || document.querySelector(".nav-contacts"),
    btnSettings:  () => document.getElementById("btn-settings") || document.querySelector('[data-nav="settings"]') || document.querySelector(".nav-settings"),

    // Liste
    contactList:  () => document.getElementById("contact-list") || document.querySelector(".contact-list") || document.querySelector("#user-conversations-list"),
  };

  /* ------------------------
     État global (exposé)
  ------------------------ */
  let socket = null;
  let activeContactId = null;   // conversation privée ouverte
  let activeGroupId   = null;   // conversation de groupe ouverte

  // Expose pour d’autres scripts (contacts.js, groups.js, etc.)
  window.activeContactId = null;
  window.activeGroupId   = null;

  // Cache des profils (évite de refetcher pour chaque message)
  const DEFAULT_PP = "img/default.jpg";
  const userCache  = new Map();
  window.__userCache = userCache;

  /* ------------------------
     Helpers UI
  ------------------------ */
  function escapeHtml(x) {
    return (x == null ? "" : String(x))
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isNearBottom(el, threshold = 80) {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  function scrollChatToBottom({ smooth = true } = {}) {
    const body = el.chatBody();
    if (!body) return;
    requestAnimationFrame(() => {
      body.scrollTo({ top: body.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    });
  }

  function setHeaderTitle(text) {
    const h = el.chatHeader();
    if (!h) return;
    if (h.querySelector("h3")) h.querySelector("h3").textContent = text;
    else h.textContent = text;
  }

  function showChat() {
    el.contactPanel()?.classList.add("hidden");
    el.chatArea()?.classList.remove("hidden");
  }
  function showContacts() {
    el.chatArea()?.classList.add("hidden");
    el.contactPanel()?.classList.remove("hidden");
  }

  /* ------------------------
     Socket.IO client
  ------------------------ */
  function connectSocket() {
    try {
      // eslint-disable-next-line no-undef
      socket = io(API); // serveur_auth.js accepte CORS *
      if (userId) socket.emit("registerUser", userId);
      bindSocketEvents();
    } catch (err) {
      console.warn("[main] Socket.IO non disponible :", err);
    }
  }

  function bindSocketEvents() {
    if (!socket) return;

    // Message privé reçu en temps réel
    socket.on("privateMessage", (data) => {
      const { senderId, receiverId, content } = data;
      const concernsMe  = (senderId === userId || receiverId === userId);
      const sameChat    = (senderId === activeContactId || receiverId === activeContactId);
      if (!concernsMe || !sameChat) return;

      displayMessage({
        senderId,
        content,
        sender_pp: userCache.get(senderId)?.pp,
        sender_username: userCache.get(senderId)?.username
      });
    });

    // Message groupe reçu en temps réel
    socket.on("groupMessage", (data) => {
      const { groupId, senderId, content } = data;
      if (groupId !== activeGroupId) return;
      displayMessage({
        senderId,
        content,
        sender_pp: userCache.get(senderId)?.pp,
        sender_username: userCache.get(senderId)?.username
      });
    });
  }

  /* ------------------------
     REST utilitaires
  ------------------------ */
  async function getUserProfileSafe(id) {
    try {
      id = parseInt(id);
      if (userCache.has(id)) return userCache.get(id);
      const res = await fetch(`${API}/user/${id}`);
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

  async function preloadSelfProfile() {
    const me = await getUserProfileSafe(userId);
    if (me) userCache.set(userId, me);
    else userCache.set(userId, { id: userId, username, pp: DEFAULT_PP });
  }

  /* ------------------------
     Rendu / messages
  ------------------------ */
  function displayMessage(data) {
    const body = el.chatBody();
    if (!body) return;

    const mine = String(data.senderId) === String(userId);
    const wrapper = document.createElement("div");
    wrapper.classList.add("chat-message", mine ? "me" : "other");

    const ppUrl = data.sender_pp || userCache.get(+data.senderId)?.pp || DEFAULT_PP;

    wrapper.innerHTML = `
      <div class="pp-message" style="background-image:url('${escapeHtml(ppUrl)}');"></div>
      <div class="text-block">
        <div class="sender-line">${escapeHtml(data.sender_username || (mine ? username : ""))}</div>
        <div class="content-line">${escapeHtml(data.content)}</div>
      </div>
    `;

    const shouldStick = isNearBottom(body);
    body.appendChild(wrapper);
    if (shouldStick || mine) scrollChatToBottom();
  }

  /* ------------------------
     Historique privé & groupe
  ------------------------ */
  async function loadPrivateDiscussion(contactId, contactName) {
    activeGroupId   = null;
    activeContactId = parseInt(contactId, 10);
    window.activeGroupId   = null;
    window.activeContactId = activeContactId;

    setHeaderTitle(contactName || "Discussion privée");
    showChat();

    const body = el.chatBody();
    if (body) body.innerHTML = "";

    try {
      const res  = await fetch(`${API}/private-messages?user1=${userId}&user2=${activeContactId}`);
      const list = await res.json();

      // Prépare cache profils
      const ids = new Set(list.map(m => m.sender_id).filter(Boolean));
      await Promise.all([...ids].map(getUserProfileSafe));

      list.forEach(m => displayMessage({
        senderId: m.sender_id,
        content:  m.content,
        sender_pp: m.sender_pp,
        sender_username: m.sender_username
      }));

      scrollChatToBottom({ smooth: false });
      bindSendForm(); // (re)lier sur la bonne discussion
    } catch (err) {
      console.error("[main] Erreur historique privé :", err);
    }
  }

  async function openGroupChat(groupId, groupName) {
    activeContactId = null;
    activeGroupId   = parseInt(groupId, 10);
    window.activeContactId = null;
    window.activeGroupId   = activeGroupId;

    if (socket) socket.emit("joinGroup", activeGroupId);

    setHeaderTitle(`[Groupe] ${groupName || ""}`);
    showChat();

    const body = el.chatBody();
    if (body) body.innerHTML = "";

    try {
      const res  = await fetch(`${API}/group-messages/${activeGroupId}`);
      const list = await res.json();

      const ids = new Set(list.map(m => m.sender_id).filter(Boolean));
      await Promise.all([...ids].map(getUserProfileSafe));

      list.forEach(m => displayMessage({
        senderId: m.sender_id,
        content:  m.content,
        sender_pp: m.sender_pp,
        sender_username: m.sender_username
      }));

      scrollChatToBottom({ smooth: false });
      bindSendForm();
    } catch (err) {
      console.error("[main] Erreur historique groupe :", err);
    }
  }

  /* ------------------------
     Envoi message (form)
  ------------------------ */
  function bindSendForm() {
    const form  = el.messageForm();
    const input = el.messageInput();
    if (!form || !input) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const content = (input.value || "").trim();
      if (!content) return;

      // Affichage optimiste
      const payload = {
        senderId: userId,
        content
      };
      displayMessage(payload);

      input.value = "";

      try {
        if (activeContactId) {
          // REST
          await fetch(`${API}/private-message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderId: userId,
              receiverId: activeContactId,
              content
            })
          });
          // Socket
          socket?.emit("privateMessage", {
            senderId: userId,
            receiverId: activeContactId,
            content
          });
        } else if (activeGroupId) {
          // REST (stocké par le serveur via socket dans ton implémentation)
          socket?.emit("groupMessage", {
            senderId: userId,
            groupId: activeGroupId,
            content
          });
        }
      } catch (err) {
        console.error("[main] Erreur envoi :", err);
      }
    };
  }

  /* ------------------------
     Navigation
  ------------------------ */
  function bindNavigation() {
    // Messages → charge la liste ET ouvre la 1ʳᵉ discussion automatiquement
    const btnMsg = el.btnMessages();
    if (btnMsg) {
      btnMsg.addEventListener("click", () => {
        window.loadContacts?.(true, ({ id, username }) => loadPrivateDiscussion(id, username));
      });
    } else {
      // fallback: texte "Messages" dans la sidebar
      document.querySelectorAll(".sidebar *").forEach(node => {
        if (node.textContent?.trim().toLowerCase() === "messages") {
          node.addEventListener("click", () => {
            window.loadContacts?.(true, ({ id, username }) => loadPrivateDiscussion(id, username));
          });
        }
      });
    }

    // Contacts → charge la liste SANS ouvrir de discussion
    const btnC = el.btnContacts();
    if (btnC) {
      btnC.addEventListener("click", () => {
        showContacts();
        window.loadContacts?.(false, ({ id, username }) => loadPrivateDiscussion(id, username));
      });
    }

    // Groupes (si groups.js expose loadGroups)
    const btnG = el.btnGroups();
    if (btnG) {
      btnG.addEventListener("click", () => {
        if (typeof window.loadGroups === "function") {
          window.loadGroups((g) => openGroupChat(g.id, g.name));
        } else {
          console.log("[main] loadGroups non défini (groups.js).");
        }
      });
    }

    // Paramètres (si ui.js / parametres.js gèrent l’affichage)
    const btnS = el.btnSettings();
    if (btnS) {
      btnS.addEventListener("click", () => {
        if (typeof window.openSettings === "function") window.openSettings();
      });
    }
  }

  /* ------------------------
     Boot
  ------------------------ */
  async function boot() {
    await preloadSelfProfile();
    connectSocket();
    bindNavigation();

    // Titre par défaut
    setHeaderTitle("Discussion privée la plus récente");

    // Démarrage automatique : rendre l’écran messages (liste + 1ʳᵉ discussion)
    window.loadContacts?.(true, ({ id, username }) => loadPrivateDiscussion(id, username));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Expose quelques fonctions utiles globalement
  window.loadPrivateDiscussion = loadPrivateDiscussion;
  window.openGroupChat = openGroupChat;
})();




// ======== Config & helpers ========
const API_BASE = window.API_BASE || "http://localhost:3001";
const meId = Number(localStorage.getItem("userId")); // défini au login
let currentDM = null; // {contactId, username, pp}

// petits helpers pour cibler le DOM (avec fallback)
const $ = (sel) => document.querySelector(sel);
const chatTitle = $("#chat-user") || $("#chat-title") || document.body;
const chatBody  = $("#chat-body") || $("#messages") || document.body;
const msgInput  = $("#message-input") || $("#chat-input");
const sendBtn   = $("#send-btn") || $("#send");

// aff. un message
function renderMessage({ sender_id, content, sent_at, sender_username, sender_pp }) {
  const wrap = document.createElement("div");
  const me = Number(sender_id) === meId;
  wrap.className = "chat-message " + (me ? "me" : "other");
  wrap.innerHTML = `
    <div class="pp-message" style="background-image:url('${sender_pp || "default.jpg"}')"></div>
    <div class="text-block">
      <div class="sender-line">${sender_username || (me ? "Moi" : "")}</div>
      <div class="content-line">${escapeHtml(content)}</div>
      <small style="opacity:.7">${new Date(sent_at || Date.now()).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</small>
    </div>
  `;
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function escapeHtml(s=""){return String(s)
  .replaceAll("&","&amp;").replaceAll("<","&lt;")
  .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}

// ======== Charger l'historique privé (API existante) ========
// GET /private-messages?user1=&user2=  ➜ renvoie l’historique ordonné:contentReference[oaicite:1]{index=1}
async function loadPrivateHistory(u1, u2) {
  const r = await fetch(`${API_BASE}/private-messages?user1=${u1}&user2=${u2}`);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const rows = await r.json();
  chatBody.innerHTML = "";
  rows.forEach(row => renderMessage({
    sender_id: row.sender_id,
    content: row.content,
    sent_at: row.sent_at,
    sender_username: row.sender_username,
    sender_pp: row.sender_pp
  }));
}

// ======== Ouvrir une conversation quand un contact est cliqué ========
window.addEventListener("contact:selected", async (e) => {
  const { contactId, username, pp } = e.detail;
  currentDM = { contactId, username, pp };

  // en-tête
  if (chatTitle) chatTitle.textContent = username || "Discussion privée";

  // historique
  try {
    await loadPrivateHistory(meId, contactId); // API backend:contentReference[oaicite:2]{index=2}
  } catch (err) {
    console.error("loadPrivateHistory:", err);
  }
});

// ======== Envoi de message ========
// Socket.IO côté serveur écoute "privateMessage" et stocke en base, puis ré-émet:contentReference[oaicite:3]{index=3}
function sendCurrentMessage() {
  if (!currentDM || !msgInput || !msgInput.value.trim()) return;
  const payload = {
    senderId: meId,
    receiverId: currentDM.contactId,
    content: msgInput.value.trim()
  };

  // 1) émettre en temps réel
  if (window.socket?.emit) {
    window.socket.emit("privateMessage", payload); // serveur enverra aux 2 users:contentReference[oaicite:4]{index=4}
  }

  // 2) sauvegarde HTTP (sécurise si socket rate)
  fetch(`${API_BASE}/private-message`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ senderId: meId, receiverId: currentDM.contactId, content: payload.content })
  }).catch(()=>{});

  // 3) affichage immédiat côté moi
  renderMessage({ sender_id: meId, content: payload.content, sender_username: "Moi", sender_pp: localStorage.getItem("pp") });
  msgInput.value = "";
}

sendBtn?.addEventListener("click", sendCurrentMessage);
msgInput?.addEventListener("keydown", (e)=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendCurrentMessage(); }});

// ======== Réception temps réel ========
// Le serveur émet "privateMessage" aux rooms user-* et stocke en base:contentReference[oaicite:5]{index=5}
if (window.socket?.on) {
  // s’enregistrer dans la room user-{meId} au connect
  window.socket.emit?.("registerUser", meId); // côté serveur: socket.join(`user-${userId}`):contentReference[oaicite:6]{index=6}

  window.socket.on("privateMessage", (data) => {
    const { senderId, receiverId, content } = data || {};
    if (!currentDM) return;
    // afficher uniquement si c'est la conversation ouverte
    const isForMe = receiverId === meId && senderId === currentDM.contactId;
    const isEcho  = senderId === meId && receiverId === currentDM.contactId;
    if (isForMe || isEcho) {
      renderMessage({ sender_id: senderId, content, sender_username: isEcho ? "Moi" : currentDM.username, sender_pp: isEcho ? localStorage.getItem("pp") : currentDM.pp });
    }
  });
}

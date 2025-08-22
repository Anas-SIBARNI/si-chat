/* ============================================================================
   main.js — noyau commun + boot
   - Partagé : constantes, selecteurs DOM, helpers UI, displayMessage, bindSendForm
   - Pas de logique socket/navigation/discussion ici (déplacées dans leurs fichiers)
============================================================================ */

/* ------------------------------
   Constantes / Contexte global
------------------------------ */
const API = window.API || window.API_BASE || "/api";
const userId   = parseInt(localStorage.getItem("userId") || "0", 10);
const username = localStorage.getItem("username") || "Moi";

/* Sélecteurs centralisés (fallbacks) */
const el = {
  sidebar:           () => document.querySelector(".sidebar") || document.getElementById("sidebar"),
  contactPanel:      () => document.getElementById("contact-sections") || document.querySelector(".contacts-panel"),
  discussionsPanel:  () => document.getElementById("discussions-section") || document.querySelector("#discussions"),
  chatArea:          () => document.getElementById("chat-area") || document.querySelector(".chat-area") || document.querySelector(".chat"),

  chatHeader:        () => document.getElementById("chat-user") || document.querySelector(".chat-header .title") || document.querySelector(".chat-header"),
  chatBody:          () => document.getElementById("chat-body") || document.querySelector(".chat-body"),
  messageForm:       () => document.getElementById("message-form") || document.querySelector(".chat-footer form") || document.querySelector("#chat-form"),
  messageInput:      () => document.getElementById("message-input") || document.querySelector(".chat-footer input, #chat-form input"),

  btnMessages: () =>
    document.getElementById("nav-discussions") ||
    document.getElementById("btn-messages")   ||
    document.querySelector('[data-nav="messages"]') ||
    document.querySelector(".nav-messages"),

  btnGroups:         () => document.getElementById("btn-groups")    || document.querySelector('[data-nav="groups"]')   || document.querySelector(".nav-groups"),
  btnContacts: () =>
    document.getElementById("nav-friends") ||
    document.getElementById("btn-contacts")   ||
    document.querySelector('[data-nav="contacts"]') ||
    document.querySelector(".nav-contacts"),
  btnSettings:       () => document.getElementById("btn-settings")  || document.querySelector('[data-nav="settings"]') || document.querySelector(".nav-settings"),

  discussionsList:   () => document.getElementById("discussions-list") || document.querySelector("#user-conversations-list"),
  contactList:       () => document.getElementById("contact-list")     || document.querySelector(".contact-list"),
};

/* Partagés */
const DEFAULT_PP = "img/default.jpg";
const userCache  = new Map();

/* États de conversation partagés (utilisés par discussions.js / socket.js) */
let activeContactId = null;
let activeGroupId   = null;
window.activeContactId = null;
window.activeGroupId   = null;
window.__userCache = userCache;

if (!userId) {
  console.warn("[main] Aucun userId dans localStorage — redirection possible vers login.html");
}

/* ------------------------------
   Helpers UI
------------------------------ */
function resolvePP(pp) {
  if (!pp) return "img/default.jpg";
  if (/^(https?:|data:)/i.test(pp)) return pp;
  if (pp.startsWith("/")) return `${API}${pp}`;
  return pp;
}
function escapeHtml(x) {
  return (x == null ? "" : String(x))
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
  document.getElementById('contacts-section')?.classList.add('hidden');
  el.discussionsPanel()?.classList.remove('hidden');
  el.chatArea()?.classList.remove('hidden');
}

/* ---------------------------------------
   Rendu message (utilisé partout)
--------------------------------------- */
function displayMessage(data) {
  const body = el.chatBody();
  if (!body) return;

  const mine    = String(data.senderId) === String(userId);
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
  const stick = isNearBottom(body);
  body.appendChild(wrapper);
  if (stick || mine) scrollChatToBottom();
}

/* ---------------------------------------
   Envoi message (formulaire chat)
--------------------------------------- */
function bindSendForm() {
  const form  = el.messageForm();
  const input = el.messageInput();
  if (!form || !input) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const content = (input.value || "").trim();
    if (!content) return;

    // affichage optimiste
    displayMessage({ senderId: userId, content });
    input.value = "";

    try {
      if (activeContactId) {
        await fetch(`${API}/private-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderId: userId, receiverId: activeContactId, content })
        });
        // émettre via socket global si dispo
        window.socket?.emit?.("privateMessage", { senderId: userId, receiverId: activeContactId, content });

      } else if (activeGroupId) {
        window.socket?.emit?.("groupMessage", { senderId: userId, groupId: activeGroupId, content });
      }
    } catch (err) {
      console.error("[main] Erreur envoi :", err);
    }
  };
}

/* ------------------------------
   Boot (appelle les modules)
------------------------------ */
async function boot() {
  try { await window.preloadSelfProfile?.(); } catch(e){ console.error("preloadSelfProfile", e); }
  try { window.connectSocket?.(); } catch(e){ console.error("connectSocket", e); }
  try { window.bindNavigation?.(); } catch(e){ console.error("bindNavigation", e); }

  setHeaderTitle("Discussion privée la plus récente");

  try {
    window.loadContacts?.(true, ({ id, username }) => window.loadPrivateDiscussion?.(id, username));
  } catch(e){ console.error("loadContacts/loadPrivateDiscussion", e); }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

/* ------------------------------
   Exposition minimale (partagés)
------------------------------ */
window.displayMessage = displayMessage;
window.bindSendForm   = bindSendForm;
window.setHeaderTitle = setHeaderTitle;
window.showChat       = showChat;
window.resolvePP      = resolvePP;
window.el             = el;
window.DEFAULT_PP     = DEFAULT_PP;
window.userCache      = userCache;
window.API            = API;
window.userId         = userId;
window.username       = username;

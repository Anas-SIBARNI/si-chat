/* ============================================================================
   socket.js — connexion Socket.IO robuste + listeners sur bonne instance
   Dépend de globals: DEFAULT_PP, userId, window.activeContactId, window.activeGroupId,
   userCache, displayMessage, getUserProfileSafe (exposé par discussions.js),
   setUnread, setPresenceDot, updateConversationSnippet (main.js)
============================================================================ */

(() => {
  const SOCKET_URL = window.SOCKET_URL || window.location.origin;
  let socket = null;           // instance courante
  let lastBound = null;        // dernière instance sur laquelle on a bindé

  const N = (x) => Number.parseInt(x, 10) || 0;

  function connectSocket() {
    try {
      // déjà connecté/en cours → ne rien faire
      if (socket?.connected || socket?.connecting) return;

      // si une vieille instance existe, nettoyer proprement
      try { socket?.removeAllListeners?.(); socket?.close?.(); } catch {}

      // (re)crée une instance
      socket = window.io(SOCKET_URL, {
        path: "/socket.io",
        withCredentials: true,
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
      });

      // exposer global (main.js et d'autres scripts émettent dessus)
      window.socket = socket;

      // (re)enregistrement de l'utilisateur à chaque connexion
      socket.on("connect", () => {
        if (userId) socket.emit("registerUser", N(userId));
      });

      // logs utiles
      socket.on("connect_error", (err) => console.warn("[socket] connect_error:", err?.message || err));
      socket.on("disconnect",     (reason) => {/* console.log("[socket] disconnect:", reason); */});
      socket.on("reconnect_attempt", (n) => {/* console.log("[socket] reconnect_attempt:", n); */});

      // (re)bind des événements applicatifs sur CETTE instance
      bindSocketEvents();
    } catch (err) {
      console.warn("[socket] Socket.IO non disponible :", err);
    }
  }

  function bindSocketEvents() {
    if (!socket) return;
    if (lastBound === socket) return;
    lastBound = socket;

    socket.removeAllListeners?.("privateMessage");
    socket.removeAllListeners?.("groupMessage");
    socket.removeAllListeners?.("presence:update");

    // --- Message privé ---
    socket.on("privateMessage", async (data) => {
      const senderId   = N(data?.senderId);
      const receiverId = N(data?.receiverId);
      const myId       = N(userId);
      const activeId   = N(window.activeContactId);

      // ne me concerne pas
      if (!(senderId === myId || receiverId === myId)) return;

      // contact "cible" dont la ligne doit bouger (si c'est moi l'émetteur → autre = receiverId)
      const otherId = (senderId === myId) ? receiverId : senderId;

      // DM non ouverte → incrément badge + mettre à jour l'aperçu/heure + remonter en tête
      if (senderId !== myId && senderId !== activeId) {
        const badge = document.getElementById(`unread-${otherId}`);
        const cur = badge && !badge.classList.contains("hidden")
          ? parseInt(badge.textContent, 10) : 0;
        if (typeof setUnread === "function") setUnread(otherId, cur + 1);

        if (typeof window.updateConversationSnippet === "function") {
          window.updateConversationSnippet(otherId, data?.content, new Date().toISOString());
        }
        return;
      }

      // DM ouverte → afficher le message, puis mettre à jour la ligne (aperçu/heure + remontée)
      let profile = userCache.get(senderId);
      if (!profile && typeof window.getUserProfileSafe === "function") {
        profile = await window.getUserProfileSafe(senderId);
      }
      displayMessage({
        senderId,
        content: data?.content,
        sender_pp: profile?.pp || DEFAULT_PP,
        sender_username: profile?.username || "Utilisateur",
      });

      if (typeof window.updateConversationSnippet === "function") {
        window.updateConversationSnippet(otherId, data?.content, new Date().toISOString());
      }
    });

    // --- Message groupe ---
    socket.on("groupMessage", async (data) => {
      const groupId   = N(data?.groupId);
      const senderId  = N(data?.senderId);
      const activeGid = N(window.activeGroupId);
      if (groupId !== activeGid) return;

      let profile = userCache.get(senderId);
      if (!profile && typeof window.getUserProfileSafe === "function") {
        profile = await window.getUserProfileSafe(senderId);
      }
      displayMessage({
        senderId,
        content: data?.content,
        sender_pp: profile?.pp || DEFAULT_PP,
        sender_username: profile?.username || "Utilisateur",
      });
    });

    // --- Présence temps réel ---
    socket.on("presence:update", ({ userId, en_ligne }) => {
      if (typeof setPresenceDot === "function") {
        setPresenceDot(userId, !!en_ligne);
      }
    });
  }

  // export
  window.connectSocket = connectSocket;
})();

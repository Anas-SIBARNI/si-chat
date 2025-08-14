
/* =====================================================
   contacts.js — liste des amis
   - Récupère les contacts via /friends/:userId
   - Rend la liste dans #contact-list (ou un fallback)
   - Permet d'ouvrir une discussion au clic
   - Option autoOpenFirst pour ouvrir la 1ʳᵉ discussion (Messages)
===================================================== */
(function () {
  const API = "http://localhost:3001";

  function getUserId() {
    return parseInt(localStorage.getItem("userId") || "0", 10);
  }

  function getListContainer() {
    return (
      document.getElementById("contact-list") ||
      document.querySelector(".contact-list") ||
      document.querySelector("#user-conversations-list") ||
      createFallbackList()
    );
  }

  function createFallbackList() {
    const container = document.querySelector(".contacts-panel") || document.getElementById("contact-section") || document.querySelector(".sidebar") || document.body;
    const ul = document.createElement("div");
    ul.id = "contact-list";
    container.appendChild(ul);
    return ul;
  }

  function markActive(contactId) {
    document.querySelectorAll("#contact-list .contact-item").forEach(el => {
      if (String(el.dataset.contactId) === String(contactId)) el.classList.add("active");
      else el.classList.remove("active");
    });
  }

  function row(contact, onOpen) {
    const div = document.createElement("div");
    div.className = "contact-item";
    div.dataset.contactId = contact.id;

    const pp = (contact.pp || "img/default.jpg").replace(/"/g, "&quot;");
    div.innerHTML = `
      <div class="pp" style="background-image:url('${pp}'); background-size:cover; background-position:center;"></div>
      <div class="labels">
        <strong>${contact.username}</strong>
        <small class="muted">${contact.isOnline ? "En ligne" : "Hors ligne"}</small>
      </div>
    `;

    div.addEventListener("click", () => {
      markActive(contact.id);
      if (typeof onOpen === "function") onOpen(contact);
    });

    return div;
  }

  async function loadContacts(autoOpenFirst = false, onOpen = null) {
    const userId = getUserId();
    if (!userId) return;

    const list = getListContainer();
    list.innerHTML = "";

    try {
      const res = await fetch(`${API}/friends/${userId}`);
      const friends = await res.json();

      if (!Array.isArray(friends) || friends.length === 0) {
        list.innerHTML = `<div class="empty muted">Aucun contact</div>`;
        return;
      }

      // (option) trier par "plus récent" si tu as un champ (à adapter)
      // friends.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));

      friends.forEach(f => list.appendChild(row(f, onOpen)));

      if (autoOpenFirst) {
        const first = friends[0];
        markActive(first.id);
        if (typeof onOpen === "function") onOpen(first);
      }
    } catch (err) {
      console.error("[contacts] Erreur chargement :", err);
      list.innerHTML = `<div class="error">Erreur de chargement</div>`;
    }
  }

  // Expose API
  window.loadContacts = loadContacts;
  window.__markActiveContact = markActive;
})();

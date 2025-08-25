/* ============================================================================
   contacts.js — liste des amis (colonne Discussions)
   Rôle:
     - Récupère /friends/:userId
     - Rend dans #discussions-list (avec fallbacks)
     - Ouvre une DM au clic (via callback onOpen)
     - autoOpenFirst: ouvre la 1ʳᵉ DM (onglet Messages)
   Dépend de: window.API (/api fallback), resolvePP/escapeHtml (optionnels)
============================================================================ */

(function () {
  // Base API (unifiée)
  const CONTACTS_API = window.API || window.API_BASE || "/api";

  // Helpers locaux
  const getUserId = () => Number.parseInt(localStorage.getItem("userId") || "0", 10);
  const EH = (s) => (typeof window.escapeHtml === "function" ? window.escapeHtml(s) : String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
  const PP = (u) => (typeof window.resolvePP === "function" ? window.resolvePP(u) : (u || "img/default.jpg"));

  /* ---------------------------------
     Ciblage du conteneur de liste
  ---------------------------------- */
  function getListContainer() {
    // cible idéale (nouvelle)
    return (
      document.getElementById("discussions-list") ||
      // anciens ids/classes éventuellement présents
      document.getElementById("contact-list") ||
      document.querySelector(".contact-list") ||
      document.querySelector("#user-conversations-list") ||
      // fallback: on crée une liste dans la colonne Discussions
      createFallbackList()
    );
  }

  function createFallbackList() {
    const container =
      document.getElementById("discussions-section") ||
      document.querySelector("#discussions-section") ||
      document.querySelector(".sidebar") ||
      document.body;

    const div = document.createElement("div");
    div.id = "discussions-list";
    container.appendChild(div);
    return div;
  }

  /* ---------------------------------
     UI: marquer l’item actif
  ---------------------------------- */
  function markActive(contactId) {
    const list = getListContainer();
    list.querySelectorAll(".contact-item").forEach(el => {
      el.classList.toggle("active", String(el.dataset.contactId) === String(contactId));
    });
  }

  /* ---------------------------------
     UI: une ligne de contact
  ---------------------------------- */
  function row(contact, onOpen) {
    const div = document.createElement("div");
    div.className = "contact-item";
    div.dataset.contactId = contact.id;

    const pp = PP(contact.pp).replace(/"/g, "&quot;");
    const name = EH(contact.username);

    div.innerHTML = `
      <div class="pp" style="background-image:url('${pp}'); background-size:cover; background-position:center;"></div>
      <div class="labels">
        <strong>${name}</strong>
        <small class="muted">${contact.isOnline ? "En ligne" : "Hors ligne"}</small>
      </div>
    `;

    div.addEventListener("click", () => {
      markActive(contact.id);
      if (typeof onOpen === "function") onOpen(contact);
    });

    return div;
  }

  /* ---------------------------------
     Charger et afficher les contacts
  ---------------------------------- */
  async function loadContacts(autoOpenFirst = false, onOpen = null) {
    const uid = getUserId();
    if (!uid) return;

    const list = getListContainer();
    list.innerHTML = "";

    try {
      const res = await fetch(`${CONTACTS_API}/friends/${uid}`);
      if (!res.ok) throw new Error("HTTP " + res.status);

      const friends = await res.json();

      if (!Array.isArray(friends) || friends.length === 0) {
        list.innerHTML = `<div class="empty muted">Aucun contact</div>`;
        return;
      }

      // (option) trier par dernier message si dispo (à activer quand champ présent)
      // friends.sort((a,b) => new Date(b.last_message_at) - new Date(a.last_message_at));

      friends.forEach(f => list.appendChild(row(f, onOpen)));

      if (autoOpenFirst) {
        const first = friends[0];
        markActive(first.id);
        if (typeof onOpen === "function") onOpen(first);/* ============================================================================
        contacts.js — liste des amis (colonne Discussions)
        Rôle:
          - Récupère /friends/:userId
          - Rend dans #discussions-list (avec fallbacks)
          - Ouvre une DM au clic (via callback onOpen)
          - autoOpenFirst: ouvre la 1ʳᵉ DM (onglet Messages)
        Dépend de: window.API (/api fallback), resolvePP/escapeHtml (optionnels)
     ============================================================================ */
     
     (function () {
       // Base API (unifiée)
       const CONTACTS_API = window.API || window.API_BASE || "/api";
     
       // Helpers locaux
       const getUserId = () => Number.parseInt(localStorage.getItem("userId") || "0", 10);
       const EH = (s) => (typeof window.escapeHtml === "function" ? window.escapeHtml(s) : String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
       const PP = (u) => (typeof window.resolvePP === "function" ? window.resolvePP(u) : (u || "img/default.jpg"));
     
       /* ---------------------------------
          Ciblage du conteneur de liste
       ---------------------------------- */
       function getListContainer() {
         // cible idéale (nouvelle)
         return (
           document.getElementById("discussions-list") ||
           // anciens ids/classes éventuellement présents
           document.getElementById("contact-list") ||
           document.querySelector(".contact-list") ||
           document.querySelector("#user-conversations-list") ||
           // fallback: on crée une liste dans la colonne Discussions
           createFallbackList()
         );
       }
     
       function createFallbackList() {
         const container =
           document.getElementById("discussions-section") ||
           document.querySelector("#discussions-section") ||
           document.querySelector(".sidebar") ||
           document.body;
     
         const div = document.createElement("div");
         div.id = "discussions-list";
         container.appendChild(div);
         return div;
       }
     
       /* ---------------------------------
          UI: marquer l’item actif
       ---------------------------------- */
       function markActive(contactId) {
         const list = getListContainer();
         list.querySelectorAll(".contact-item").forEach(el => {
           el.classList.toggle("active", String(el.dataset.contactId) === String(contactId));
         });
       }
     
       /* ---------------------------------
          UI: une ligne de contact
       ---------------------------------- */
       function row(contact, onOpen) {
         const div = document.createElement("div");
         div.className = "contact-item";
         div.dataset.contactId = contact.id;
     
         const pp = PP(contact.pp).replace(/"/g, "&quot;");
         const name = EH(contact.username);
     
         div.innerHTML = `
           <div class="pp" style="background-image:url('${pp}'); background-size:cover; background-position:center;"></div>
           <div class="labels">
             <strong>${name}</strong>
             <small class="muted">${contact.isOnline ? "En ligne" : "Hors ligne"}</small>
           </div>
         `;
     
         div.addEventListener("click", () => {
           markActive(contact.id);
           if (typeof onOpen === "function") onOpen(contact);
         });
     
         return div;
       }
     
       /* ---------------------------------
          Charger et afficher les contacts
       ---------------------------------- */
       async function loadContacts(autoOpenFirst = false, onOpen = null) {
         const uid = getUserId();
         if (!uid) return;
     
         const list = getListContainer();
         list.innerHTML = "";
     
         try {
           const res = await fetch(`${CONTACTS_API}/friends/${uid}`);
           if (!res.ok) throw new Error("HTTP " + res.status);
     
           const friends = await res.json();
     
           if (!Array.isArray(friends) || friends.length === 0) {
             list.innerHTML = `<div class="empty muted">Aucun contact</div>`;
             return;
           }
     
           // (option) trier par dernier message si dispo (à activer quand champ présent)
           // friends.sort((a,b) => new Date(b.last_message_at) - new Date(a.last_message_at));
     
           friends.forEach(f => list.appendChild(row(f, onOpen)));
     
           if (autoOpenFirst) {
             const first = friends[0];
             markActive(first.id);
             if (typeof onOpen === "function") onOpen(first);
           }
         } catch (err) {
           console.error("[contacts] chargement:", err);
           list.innerHTML = `<div class="error">Erreur de chargement</div>`;
         }
       }
     
       /* ---------------------------------
          Exports globaux
       ---------------------------------- */
       window.loadContacts = loadContacts;
       window.__markActiveContact = markActive;
     })();
     
      }
    } catch (err) {
      console.error("[contacts] chargement:", err);
      list.innerHTML = `<div class="error">Erreur de chargement</div>`;
    }
  }



function repondreDemande(id, reponse) {
  fetch(`${API}/friend-request/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // si tu utilises des cookies/sessions
    body: JSON.stringify({ requestId: Number(id), response: reponse })
  })
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(() => {
    // petit feedback + refresh de l’onglet “En attente”
    alert(`Demande ${reponse === 'accepte' ? 'acceptée' : 'refusée'}`);
    if (typeof switchTab === 'function') switchTab('pending');
  })
  .catch(err => {
    console.error('Erreur repondreDemande:', err);
    alert("Impossible d'envoyer la réponse pour l'instant. Réessaie.");
  });
}

/* ---------------------------------
   Exports globaux (garde-les)
---------------------------------- */
window.loadContacts = loadContacts;
window.__markActiveContact = markActive;
window.repondreDemande = repondreDemande;


})();

/* ============================================================================
   contacts.js — liste des contacts (colonne Discussions)
   - Source: /contacts/:userId/last-messages  → contact_id, contact_username, contact_pp,
                                                contact_en_ligne, last_content, last_sent_at
   - Rend dans #discussions-list (fallbacks possibles)
   - Ouvre une DM au clic (via callback onOpen)
   - autoOpenFirst: ouvre la 1ʳᵉ DM
   Dépend de: window.API (/api fallback), resolvePP/escapeHtml (optionnels)
============================================================================ */

(function () {
  // Base API
  const CONTACTS_API = window.API || window.API_BASE || "/api";

  // Helpers
  const getUserId = () => Number.parseInt(localStorage.getItem("userId") || "0", 10);
  const EH = (s) =>
    (typeof window.escapeHtml === "function"
      ? window.escapeHtml(s)
      : String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])));
  const PP = (u) => (typeof window.resolvePP === "function" ? window.resolvePP(u) : (u || "img/default.jpg"));

  const trimPreview = (s, max = 60) => {
    const t = String(s || "");
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
  };
  const FMT = (ts) => (typeof window.formatChatTime === "function" ? window.formatChatTime(ts) : "");
  

  /* ---------------------------------
     Ciblage du conteneur de liste
  ---------------------------------- */
  function getListContainer() {
    return (
      document.getElementById("discussions-list") ||
      document.getElementById("contact-list") ||
      document.querySelector(".contact-list") ||
      document.querySelector("#user-conversations-list") ||
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
  function renderSkeleton(list, n = 6) {
    list.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const row = document.createElement("div");
      row.className = "contact-item skeleton";
      row.innerHTML = `
        <div class="skel pp"></div>
        <div class="meta">
          <div class="skel name"></div>
          <div class="skel prev"></div>
        </div>
        <div class="end">
          <div class="skel time"></div>
        </div>
      `;
      list.appendChild(row);
    }
  }
  function renderEmpty(list, msg = "Aucun contact") {
    list.innerHTML = `<div class="list-empty">${msg}</div>`;
  }
  

  /* ---------------------------------
     UI: marquer l’item actif
  ---------------------------------- */
  function markActive(contactId) {
    const list = getListContainer();
    list.querySelectorAll(".contact-item").forEach((el) => {
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
      <div class="meta">
        <div class="name">
          ${name}
          <span id="presence-${contact.id}" class="presence-dot ${contact.contact_en_ligne ? "online" : "offline"}"></span>
        </div>
        <div class="preview">${contact.contact_en_ligne ? "En ligne" : "Hors ligne"}</div>
      </div>
      <div class="end">
        <span class="time">${FMT(contact.last_sent_at)}</span>
        <span id="unread-${contact.id}" class="badge hidden">0</span>
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
    renderSkeleton(list, 6); // affiche le skeleton immédiatement
  
    try {
      // 1) récupérer la liste enrichie (dernier message + présence)
      const res = await fetch(`${CONTACTS_API}/contacts/${uid}/last-messages`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const raw = await res.json();
  
      if (!Array.isArray(raw) || raw.length === 0) {
        renderEmpty(list, "Aucun contact");
        return;
      }
  
      // 2) normaliser les champs pour le rendu
      const contacts = raw.map((r) => ({
        id: r.contact_id,
        username: r.contact_username,
        pp: r.contact_pp,
        contact_en_ligne: !!r.contact_en_ligne,
        last_content: r.last_content,
        last_sent_at: r.last_sent_at,
      }));
  
      // 3) tri par récence (NULLS en bas)
      contacts.sort((a, b) => {
        const ta = a.last_sent_at ? new Date(a.last_sent_at).getTime() : 0;
        const tb = b.last_sent_at ? new Date(b.last_sent_at).getTime() : 0;
        return tb - ta;
      });
  
      // 4) rendu
      list.innerHTML = ""; // efface le skeleton
      contacts.forEach((c) => list.appendChild(row(c, onOpen)));
  
      // 5) ouverture auto de la 1ʳᵉ discussion (optionnel)
      if (autoOpenFirst) {
        const first = contacts[0];
        if (first) {
          markActive(first.id);
          if (typeof onOpen === "function") onOpen(first);
        }
      }
    } catch (err) {
      console.error("[contacts] chargement:", err);
      renderEmpty(list, "Erreur de chargement");
    }
  }

  /* ---------------------------------
     Demandes en attente (utilisé par UI)
  ---------------------------------- */
  function repondreDemande(id, reponse) {
    fetch(`${CONTACTS_API}/contact-request/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ requestId: Number(id), response: reponse }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(() => {
        alert(`Demande ${reponse === "accepte" ? "acceptée" : "refusée"}`);
        if (typeof switchTab === "function") switchTab("pending");
      })
      .catch((err) => {
        console.error("Erreur repondreDemande:", err);
        alert("Impossible d'envoyer la réponse pour l'instant. Réessaie.");
      });
  }

/* ---------------------------------
   Fonction d'ajout de contact (à ajouter dans ui.js)
---------------------------------- */

function addContact(event) {
  event.preventDefault();
  
  const input = document.getElementById("new-contact");
  const result = document.getElementById("add-result");
  
  if (!input || !result) {
    console.error("[addContact] Éléments DOM manquants");
    return;
  }
  
  const username = input.value.trim();
  if (!username) {
    result.textContent = "Veuillez saisir un nom d'utilisateur.";
    result.className = "add-result-message error";
    return;
  }
  
  const uid = getUID();
  if (!uid) {
    result.textContent = "Erreur: utilisateur non connecté.";
    result.className = "add-result-message error";
    return;
  }
  
  // Désactiver le bouton et afficher un état de chargement
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi...";
  
  result.textContent = "Envoi de la demande...";
  result.className = "add-result-message";
  
  // Envoyer la demande d'ajout
  fetch(`${UI_API}/contact-request`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json" 
    },
    credentials: "include",
    body: JSON.stringify({ 
      senderId: uid, 
      receiverUsername: username 
    })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        // Gestion spécifique des codes d'erreur
        if (response.status === 404) {
          throw new Error("Utilisateur introuvable");
        } else if (response.status === 409) {
          throw new Error(err.error || "Demande déjà envoyée ou vous êtes déjà amis");
        } else if (response.status === 400) {
          throw new Error(err.error || "Données invalides");
        } else {
          throw new Error(err.error || "Erreur serveur");
        }
      });
    }
    return response.json();
  })
  .then(data => {
    result.textContent = "Demande d'ajout envoyée avec succès !";
    result.className = "add-result-message success";
    input.value = ""; // Vider le champ
  })
  .catch(error => {
    console.error("[addContact] Erreur:", error);
    
    // Affichage du message d'erreur
    result.textContent = error.message || "Erreur lors de l'envoi de la demande. Réessayez.";
    result.className = "add-result-message error";
  })
  .finally(() => {
    // Restaurer le bouton
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  });
}



  /* ---------------------------------
     Exports globaux
  ---------------------------------- */
  window.loadContacts = loadContacts;
  window.__markActiveContact = markActive;
  window.repondreDemande = repondreDemande;
  window.addContact = addContact;

})();

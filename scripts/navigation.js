/* ============================================================================
   navigation.js — Navigation principale (Discussions / Groupes / Contacts / Paramètres)
   Dépend (optionnel) de globals: el, loadContacts, loadPrivateDiscussion, loadGroups,
   openGroupChat, openSettings
============================================================================ */

/* ---------- Utils DOM ---------- */
const $d = (id) => document.getElementById(id);

/* Met l’onglet actif (li + a) dans la sidebar */
function setSidebarActive(id) {
  const ids = ["nav-discussions", "nav-groups", "nav-contacts"];
  ids.forEach(x => {
    const li = $d(x);
    const a  = li?.querySelector("a");
    const on = x === id;
    li && li.classList.toggle("active", on);
    a  && a.classList.toggle("active", on);
  });
}

/* Affiche une section cible et masque les autres. Masque/affiche aussi le chat. */
function showSection(targetId) {
  const ALL = ["discussions-section", "group-section", "contacts-section"];
  ALL.forEach(id => {
    const node = $d(id);
    if (!node) return;
    const show = id === targetId;
    node.style.display = show ? "block" : "none";
    node.classList.toggle("hidden", !show);
  });

  const contactsView = (targetId === "contacts-section");
  
  // Masquer le chat ET étendre contacts-section
  const header = $d("chat-header") || document.querySelector(".chat-header");
  const body   = $d("chat-body")   || document.querySelector(".chat-body");
  const form   = $d("chat-form")   || document.querySelector(".chat-footer");
  const chatArea = $d("chat-area");
  const contactsSection = $d("contacts-section");
  
  if (contactsView) {
    // Masquer les éléments du chat
    if (header) header.style.display = "none";
    if (body)   body.style.display = "none";
    if (form)   form.style.display = "none";
    
    // Étendre contacts-section sur 2 colonnes
    if (chatArea) chatArea.style.gridColumn = "2 / 4"; // colonnes 2+3
    if (contactsSection) contactsSection.style.display = "block";
    
  } else {
    // Restaurer l'affichage normal
    if (header) header.style.display = "";
    if (body)   body.style.display = "";
    if (form)   form.style.display = "";
    if (chatArea) chatArea.style.gridColumn = "3"; // colonne 3 seulement
    if (contactsSection) contactsSection.style.display = "none";
  }
}

/* Active visuellement un bouton d’UI existant (si tu utilises el.*) */
function setActiveNav(btn) {
  if (!window.el) return;
  [el.btnMessages?.(), el.btnContacts?.(), el.btnGroups?.(), el.btnSettings?.()]
    .filter(Boolean)
    .forEach(b => b.classList.toggle("is-active", b === btn));
}

/* ---------- Bind principal ---------- */
function bindNavigation() {
  if (bindNavigation._bound) return;
  bindNavigation._bound = true;

  // Discussions
  $d('nav-discussions')?.addEventListener('click', async (e) => {
    e.preventDefault();
    setSidebarActive('nav-discussions');
    setActiveNav(el?.btnMessages?.());

    showSection('discussions-section');

    // Recharge éventuellement la liste et ouvre la 1ʳᵉ discussion
    try {
      if (typeof window.loadContacts === "function") {
        await window.loadContacts(true, ({ id, username }) => {
          if (typeof window.loadPrivateDiscussion === "function") {
            loadPrivateDiscussion(id, username);
          }
        });
      }
    } catch (err) {
      console.warn("[nav] loadContacts (messages) a échoué:", err);
    }
  });

  


  // Groupes
  $d('nav-groups')?.addEventListener('click', (e) => {
    e.preventDefault();
    setSidebarActive('nav-groups');
    setActiveNav(el?.btnGroups?.());

    showSection('group-section');

    // Charger groupes
    if (typeof window.loadGroupsa === "function") {
      window.loadGroups((g) => {
        if (typeof window.openGroupChat === "function") {
          openGroupChat(g.id, g.name);/* ============================================================================
          navigation.js — bind des boutons de navigation (messages, contacts, groupes, paramètres)
          Dépend de globals: el, showContactSection, loadContacts, loadPrivateDiscussion,
          openGroupChat, loadGroups, openSettings
       ============================================================================ */
       
       function bindNavigation() {
         // évite d’attacher les handlers plusieurs fois
         if (bindNavigation._bound) return;
         bindNavigation._bound = true;
       
         // helper: active le bouton courant, désactive les autres
         const setActiveNav = (btn) => {
           [el.btnMessages(), el.btnContacts(), el.btnGroups(), el.btnSettings()]
             .filter(Boolean)
             .forEach(b => b.classList.toggle("is-active", b === btn));
         };
       
         /* --- Messages --- */
         const btnMsg = el.btnMessages();
         if (btnMsg) {
           btnMsg.addEventListener("click", async () => {
             setActiveNav(btnMsg);
             btnMsg.disabled = true; // évite double-clic
             try {
               // recharge la liste et ouvre la 1ʳᵉ discussion
               await window.loadContacts?.(true, ({ id, username }) => loadPrivateDiscussion(id, username));
             } finally {
               btnMsg.disabled = false;
             }
           });
         } else {
           // fallback si markup alternatif
           document.querySelectorAll('[data-nav="messages"]').forEach(node => {
             node.addEventListener("click", () => {
               setActiveNav(node);
               window.loadContacts?.(true, ({ id, username }) => loadPrivateDiscussion(id, username));
             });
           });
         }
       
         /* --- Contacts --- */
         const btnC = el.btnContacts();
         if (btnC) {
           btnC.addEventListener("click", () => {
             setActiveNav(btnC);
             showContactSection?.();
             // charge la liste sans ouvrir automatiquement
             window.loadContacts?.(false, ({ id, username }) => loadPrivateDiscussion(id, username));
             document.getElementById("contact-sections")?.focus?.();
           });
         }
       
         /* --- Groupes --- */
         const btnG = el.btnGroups();
         if (btnG) {
           btnG.addEventListener("click", () => {
             setActiveNav(btnG);
             if (typeof window.loadGroups === "function") {
               window.loadGroups((g) => openGroupChat(g.id, g.name));
             } else {
               console.warn("[nav] loadGroups non défini (groups.js).");
             }
           });
         }
       
         /* --- Paramètres --- */
         const btnS = el.btnSettings();
         if (btnS) {
           btnS.addEventListener("click", () => {
             setActiveNav(btnS);
             if (typeof window.openSettings === "function") {
               window.openSettings();
             } else {
               console.warn("[nav] openSettings non défini.");
             }
           });
         }
       }
       
       window.bindNavigation = bindNavigation;
       
        }
      });
    } else if (typeof window.loadUserGroups === "function") {
      // compat ancien nom
      loadUserGroups();
    } else {
      console.warn("[nav] Aucune fonction de chargement des groupes trouvée.");
    }
  });

  // Contacts
  $d('nav-contacts')?.addEventListener('click', (e) => {
    e.preventDefault();
    setSidebarActive('nav-contacts');
    setActiveNav(el?.btnContacts?.());

    showSection('contacts-section');          // <-- affiche Contacts, masque Discussions + Chat

    // Charger la liste sans ouverture auto
    if (typeof window.loadContacts === "function") {
      window.loadContacts(false, ({ id, username }) => {
        if (typeof window.loadPrivateDiscussion === "function") {
          loadPrivateDiscussion(id, username);
        }
      });
    }
    // Focus sur la zone (ID correct : contacts-section)
    $d('contacts-section')?.focus?.();
  });

  // Paramètres (si tu as un bouton dans l’UI hors sidebar)
  const btnS = el?.btnSettings?.();
  if (btnS) {
    btnS.addEventListener("click", (e) => {
      e.preventDefault?.();
      setActiveNav(btnS);
      if (typeof window.openSettings === "function") {
        openSettings();
      } else {
        console.warn("[nav] openSettings non défini.");
      }
    });
  }
}

/* ---------- Bootstrap minimal ---------- */
if (!window.userId) {
  window.userId = localStorage.getItem('userId');
}

window.showSection     = showSection;
window.setSidebarActive = setSidebarActive;
window.bindNavigation   = bindNavigation;

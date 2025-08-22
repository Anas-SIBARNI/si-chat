/* ============================================================================
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

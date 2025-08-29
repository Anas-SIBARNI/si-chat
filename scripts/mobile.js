// scripts/mobile.js
/* =========================================================
   Mobile modes (≤600px) — si-chat
   États: mode-list | mode-groups | mode-chat | mode-contacts
   Place: scripts/navigation.js (ou nouveau scripts/mobile-mode.js)
========================================================= */
(function () {
    const APP = () => document.querySelector('.app-container');
    const IS_MOBILE = () => window.matchMedia('(max-width: 600px)').matches;
  
    let lastListMode = 'mode-list'; // se souvient si on vient de D (list) ou de G (groups)
  
    function setMode(mode) {
      const app = APP(); if (!app) return;
      app.classList.remove('mode-list','mode-groups','mode-chat','mode-contacts');
      app.classList.add(mode);
    }
  
    // ----- Initialisation état par défaut
    function initDefaultMode() {
      if (IS_MOBILE()) setMode('mode-list');  // en arrivant: sidebar + liste discussions
    }
  
    // ----- Brancher la sidebar: D / G / C
    function bindSidebarNav() {
      const btnD = document.getElementById('nav-discussions');
      const btnG = document.getElementById('nav-groups');
      const btnC = document.getElementById('nav-contacts');
  
      if (btnD) btnD.addEventListener('click', (e) => {
        if (IS_MOBILE()) {
          e.preventDefault();
          lastListMode = 'mode-list';
          // charge ta liste si nécessaire (optionnel)
          if (typeof window.loadContacts === 'function') {
            // ici loadContacts peuple la colonne .contacts avec les discussions
            window.loadContacts();
          }
          setMode('mode-list');
        }
      });
  
      if (btnG) btnG.addEventListener('click', (e) => {
        if (IS_MOBILE()) {
          e.preventDefault();
          lastListMode = 'mode-groups';
          // charge la liste de groupes si nécessaire
          if (typeof window.loadGroups === 'function') {
            window.loadGroups(); // ta fonction existante remplit la colonne .contacts
          }
          setMode('mode-groups');
        }
      });
  
      if (btnC) btnC.addEventListener('click', (e) => {
        if (IS_MOBILE()) {
          e.preventDefault();
          // affiche contacts plein écran
          if (typeof window.switchTab === 'function') {
            window.switchTab('all'); // onglet par défaut
          }
          setMode('mode-contacts');
        }
      });
    }
  
    // ----- Sur clic d'une discussion (ou groupe) -> passer en mode chat
    // Branche-toi sur tes callbacks existants d’ouverture de discussion
    function patchOpeners() {
      // Private chat
      const openPrivate = window.loadPrivateDiscussion || window.openPrivateChat;
      if (typeof openPrivate === 'function') {
        // wrap sans casser l'existant
        window.openPrivateChat = function (...args) {
          const ret = openPrivate.apply(this, args);
          if (IS_MOBILE()) setMode('mode-chat');
          return ret;
        };
      }
  
      // Group chat
      if (typeof window.openGroupChat === 'function') {
        const _openGroupChat = window.openGroupChat;
        window.openGroupChat = function (...args) {
          const ret = _openGroupChat.apply(this, args);
          if (IS_MOBILE()) setMode('mode-chat');
          return ret;
        };
      }
  
      // Si tes listes utilisent un simple <a onclick="...">, ajoute aussi
      // un listener générique sur la colonne .contacts :
      const listCol = document.querySelector('.contacts');
      if (listCol) {
        listCol.addEventListener('click', (ev) => {
          const t = ev.target;
          // si un item déclenche l'ouverture d'une discussion...
          if (t.closest && t.closest('[data-open-chat]')) {
            if (IS_MOBILE()) setMode('mode-chat');
          }
        });
      }
    }
  
    // ----- Bouton hamburger (injection) → revient au dernier mode de liste
    function ensureHamburgers() {
      const chatHeader = document.querySelector('.chat-header');
      if (chatHeader && !chatHeader.querySelector('#btn-hamburger-chat')) {
        const btn = document.createElement('button');
        btn.id = 'btn-hamburger-chat';
        btn.className = 'btn-hamburger';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Afficher la sidebar');
        btn.innerHTML = '≡'; // remplace par un SVG si tu veux
        btn.addEventListener('click', () => {
          if (IS_MOBILE()) setMode(lastListMode); // revient à list ou groups
        });
        // on l’ajoute au début du header
        chatHeader.prepend(btn);
      }
  
      const contactsRoot = document.getElementById('contacts-section');
      if (contactsRoot && !contactsRoot.querySelector('#btn-hamburger-contacts')) {
        const btn2 = document.createElement('button');
        btn2.id = 'btn-hamburger-contacts';
        btn2.className = 'btn-hamburger';
        btn2.type = 'button';
        btn2.style.margin = '8px';
        btn2.setAttribute('aria-label', 'Afficher la sidebar');
        btn2.innerHTML = '≡';
        btn2.addEventListener('click', () => {
          if (IS_MOBILE()) setMode(lastListMode); // par défaut revenir à la liste
        });
        contactsRoot.prepend(btn2);
      }
    }
  
    // ----- Init + resize (si on change d’orientation)
    function init() {
      initDefaultMode();
      bindSidebarNav();
      patchOpeners();
      ensureHamburgers();
      window.addEventListener('resize', () => {
        // si on redevient desktop, on nettoie l’état
        if (!IS_MOBILE()) {
          const app = APP();
          app && app.classList.remove('mode-list','mode-groups','mode-chat','mode-contacts');
        } else if (!APP().classList.contains('mode-list')
                && !APP().classList.contains('mode-groups')
                && !APP().classList.contains('mode-chat')
                && !APP().classList.contains('mode-contacts')) {
          // assure un état par défaut en mobile
          setMode('mode-list');
        }
      });
    }
  
    document.addEventListener('DOMContentLoaded', init);
  })();
  
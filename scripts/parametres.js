/* ============================================================================
   parametres.js — paramètres du profil (nom, email, mdp, pp, suppression)
   Dépend de: window.API (ou window.API_BASE), localStorage (userId, username)
============================================================================ */

/* Base API (fallback) */
const PARAM_API = window.API || window.API_BASE || "/api";

/* Helpers */
const getUID = () => Number.parseInt(window.userId || localStorage.getItem("userId") || "0", 10);
const setText = (id, txt) => { const n = document.getElementById(id); if (n) n.textContent = txt; };

/* --- Vérif session + remplissage initial --- */
(() => {
  const uid = getUID();
  const uname = localStorage.getItem("username") || "";
  if (!uid || !uname) {
    alert("Veuillez vous connecter.");
    window.location.href = "login.html";
    return;
  }
  setText("settings-username", uname);
  setText("display-nom", uname);
})();

/* ---------------------------------
   Changer le nom d'utilisateur
---------------------------------- */
async function changerNom() {
  const uid = getUID(); if (!uid) return;
  const nouveau = prompt("Entrer un nouveau nom :", localStorage.getItem("username") || "");
  if (!nouveau) return;

  try {
    const res = await fetch(`${PARAM_API}/user/${uid}/name`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: nouveau })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    localStorage.setItem("username", nouveau);
    setText("settings-username", nouveau);
    setText("display-nom", nouveau);
    alert("Nom mis à jour");
  } catch (e) {
    console.error("[params] changerNom:", e);
    alert("Erreur lors de la mise à jour du nom.");
  }
}

/* ---------------------------------
   Changer la descripton utilisateur
---------------------------------- */
async function changerDescription() {
  const uid = getUID(); if (!uid) return;
  const nouveau = prompt("Entrer une nouvelle description :", localStorage.getItem("description") || "");
  if (!nouveau) return;

  try {
    const res = await fetch(`${PARAM_API}/user/${uid}/description`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: nouveau })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    localStorage.setItem("description", nouveau);
    setText("settings-description", nouveau);
    setText("display-description", nouveau);
    alert("Description mise à jour");
  } catch (e) {
    console.error("[params] changerDescription:", e);
    alert("Erreur lors de la mise à jour de la description.");
  }
}

/* ---------------------------------
   Changer l'email
---------------------------------- */
async function changerEmail() {
  const uid = getUID(); if (!uid) return;
  const email = prompt("Entrer un nouvel email :");
  if (!email) return;

  try {
    const res = await fetch(`${PARAM_API}/user/${uid}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    setText("display-email", email);
    alert("Email mis à jour");
  } catch (e) {
    console.error("[params] changerEmail:", e);
    alert("Erreur lors de la mise à jour de l'email.");
  }
}

/* ---------------------------------
   Changer le mot de passe
---------------------------------- */
async function changerMotDePasse() {
  const uid = getUID(); if (!uid) return;
  const mdp = prompt("Entrer un nouveau mot de passe :");
  if (!mdp) return;

  try {
    const res = await fetch(`${PARAM_API}/user/${uid}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: mdp })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    alert("Mot de passe mis à jour");
  } catch (e) {
    console.error("[params] changerMotDePasse:", e);
    alert("Erreur lors de la mise à jour du mot de passe.");
  }
}

/* ---------------------------------
   Changer la photo de profil (PP)
---------------------------------- */
async function changerPP() {
  const uid = getUID(); if (!uid) return;
  const url = prompt("Entrer l'URL de votre nouvelle photo de profil :");
  if (!url) return;

  try {
    const res = await fetch(`${PARAM_API}/user/${uid}/pp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pp: url })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    alert("Photo de profil mise à jour");
    // Met à jour les éléments .pp visibles (si présents)
    document.querySelectorAll(".pp").forEach(ppEl => {
      ppEl.style.backgroundImage = `url('${url}')`;
    });
  } catch (e) {
    console.error("[params] changerPP:", e);
    alert("Erreur lors de la mise à jour de la photo.");
  }
}

/* ---------------------------------
   Supprimer le compte
---------------------------------- */
async function supprimerCompte() {
  const uid = getUID(); if (!uid) return;
  if (!confirm("Êtes-vous sûr de vouloir supprimer votre compte ?")) return;

  try {
    const res = await fetch(`${PARAM_API}/user/${uid}`, { method: "DELETE" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    alert("Compte supprimé");
    localStorage.clear();
    window.location.href = "login.html";
  } catch (e) {
    console.error("[params] supprimerCompte:", e);
    alert("Erreur lors de la suppression du compte.");
  }
}

/* ---------------------------------
   Déconnexion rapide
---------------------------------- */
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

/* ---------------------------------
   Exports (si appelés via HTML)
---------------------------------- */
window.changerNom        = changerNom;
window.changerDescription= changerDescription;
window.changerEmail      = changerEmail;
window.changerMotDePasse = changerMotDePasse;
window.changerPP         = changerPP;
window.supprimerCompte   = supprimerCompte;
window.logout            = logout;

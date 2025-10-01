/* ============================================================================
   auth.js — auth + profil + logout
   Dépend si dispo de: window.API ou window.API_BASE (sinon /api)
============================================================================ */

/* Base API (fallback) */
const AUTH_API = window.API || window.API_BASE || "/api";

/* Helper: userId courant depuis localStorage */
const getUserId = () => Number.parseInt(localStorage.getItem("userId") || "0", 10);

/* ---------------------------------
   Connexion
---------------------------------- */
async function login(email, password) {
  try {
    const res = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    // parse en sécurité
    let data = null;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok || data?.error) {
      alert(data?.error || "Identifiants invalides");
      return;
    }

    // persiste l’utilisateur pour l’app
    localStorage.setItem("userId", String(data.userId));
    localStorage.setItem("username", data.username || "Moi");
    window.currentUserId = data.userId;

    // redirige vers la messagerie
    window.location.href = "messagerie.html";
  } catch (err) {
    console.error("[auth] login:", err);
    alert("Erreur de connexion");
  }
}

/* ---------------------------------
   Déconnexion
---------------------------------- */
async function logout() {
  const uid = getUserId();
  try {
    // même si ça échoue, on purge localStorage ensuite
    await fetch(`${AUTH_API}/logout/${uid || ""}`, { method: "POST" });
  } catch (e) {
    console.warn("[auth] logout:", e);
  } finally {
    localStorage.clear();
    window.location.href = "login.html";
  }
}

/* ---------------------------------
   Exports globaux (si appelés via HTML)
---------------------------------- */
window.login           = login;
window.logout          = logout;

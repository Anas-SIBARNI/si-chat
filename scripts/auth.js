// ===================
// Connexion utilisateur
// ===================
function login(email, password) {
  fetch(`http://localhost:3001/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      // Sauvegarde du userId et username pour le reste de l'application
      localStorage.setItem("userId", String(data.userId));
      localStorage.setItem("username", data.username);
      window.currentUserId = data.userId;

      // Redirection vers la messagerie
      window.location.href = 'messagerie.html';
    })
    .catch(err => {
      console.error('Erreur login:', err);
      alert('Erreur de connexion');
    });
}

// ===================
// Modification du profil
// ===================
function editDescription() {
  const current = prompt("Nouvelle description :");
  if (current === null) return;
  fetch(`http://localhost:3001/user/${userId}/description`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: current })
  })
    .then(res => res.json())
    .then(() => alert("Description mise à jour"))
    .catch(() => alert("Erreur"));
}

function editPassword() {
  const password = prompt("Nouveau mot de passe :");
  if (!password) return;
  fetch(`http://localhost:3001/user/${userId}/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
    .then(res => res.json())
    .then(() => alert("Mot de passe mis à jour"))
    .catch(() => alert("Erreur"));
}

function editEmail() {
  const email = prompt("Nouvelle adresse email :");
  if (!email) return;
  fetch(`http://localhost:3001/user/${userId}/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(() => alert("Email mis à jour"))
    .catch(() => alert("Erreur"));
}

// ===================
// Déconnexion
// ===================
function logout() {
  fetch(`http://localhost:3001/logout/${userId}`, { method: 'POST' })
    .then(() => {
      localStorage.clear();
      window.location.href = 'login.html';
    });
}

const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username');

if (!userId || !username) {
  alert("Veuillez vous connecter.");
  window.location.href = "login.html";
}

document.getElementById("settings-username").textContent = username;
document.getElementById("display-nom").textContent = username;

function changerNom() {
  const nouveau = prompt("Entrer un nouveau nom :", username);
  if (!nouveau) return;
  fetch(`http://localhost:3001/user/${userId}/name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: nouveau })
  })
    .then(res => res.json())
    .then(() => {
      alert("Nom mis à jour");
      document.getElementById("settings-username").textContent = nouveau;
      document.getElementById("display-nom").textContent = nouveau;
      localStorage.setItem('username', nouveau);
    });
}

function changerEmail() {
  const email = prompt("Entrer un nouvel email :");
  if (!email) return;
  fetch(`http://localhost:3001/user/${userId}/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(() => {
      alert("Email mis à jour");
      document.getElementById("display-email").textContent = email;
    });
}

function changerMotDePasse() {
  const mdp = prompt("Entrer un nouveau mot de passe :");
  if (!mdp) return;
  fetch(`http://localhost:3001/user/${userId}/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: mdp })
  })
    .then(res => res.json())
    .then(() => alert("Mot de passe mis à jour"));
}

function supprimerCompte() {
  if (!confirm("Êtes-vous sûr de vouloir supprimer votre compte ?")) return;
  fetch(`http://localhost:3001/user/${userId}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(() => {
      alert("Compte supprimé");
      localStorage.clear();
      window.location.href = "login.html";
    });
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}


function changerPP() {
  const url = prompt("Entrer l'URL de votre nouvelle pp :");
  if (!url) return;
  fetch(`http://localhost:3001/user/${userId}/pp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pp: url })
  })
    .then(() => {
      alert("Photo de profil mise à jour");
      document.querySelector('.pp').style.backgroundImage = `url(${url})`;
    });
}

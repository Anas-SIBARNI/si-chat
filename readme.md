# Messagerie temps réel (Projet perso)

Application web de messagerie temps réel avec gestion des discussions privées, groupes, contacts et une expérience 3D immersive d’accueil ("Waw").

---

## Fonctionnalités

### Partie messagerie classique
- Discussions privées en temps réel (Socket.IO + PostgreSQL).
- Système de contacts :
  - Recherche d’utilisateurs.
  - Envoi / acceptation / refus de demandes.
  - Ouverture automatique d’une discussion après acceptation.
- Discussions de groupe :
  - Création de groupes avec initiateur.
  - Ajout / suppression de membres.
  - Messages visibles par tous les membres en temps réel.
- Gestion du profil utilisateur :
  - Photo de profil (pp).
  - Description modifiable.
  - Paramètres : changer description, mot de passe, email.
- Mode clair / sombre sur toute l’application.

### Partie Waw (expérimentale immersive)
- Accueil 3D interactif (Three.js + GSAP).
- Tour transparente contenant des bulles de messages animées.
- Caméra qui monte le long de la tour, zoom sur un bouton pour entrer dans la messagerie.
- Effets de particules dynamiques.
- Style givré (mode clair) ou translucide (mode sombre).
- Transition fluide entre la partie Waw et l’interface principale.

---

## 🛠️ Technologies utilisées

- **Frontend :**
  - HTML5, CSS3, JavaScript (Vanilla)
  - Socket.IO (client)
  - Three.js (3D)
  - GSAP (animations)
  
- **Backend :**
  - Node.js, Express.js
  - Socket.IO (serveur)
  - PostgreSQL (persistance des données)

---

## 📂 Structure du projet

```
.
├── messagerie/              # Frontend
│   ├── css/                 # Styles (reset, base, composants, pages…)
│   ├── scripts/             # JS (auth, contacts, groupes, ui…)
│   ├── img/                 # Images statiques
│   ├── index.html           # Accueil Waw
│   ├── login.html           # Connexion
│   ├── register.html        # Inscription
│   ├── messagerie.html      # Interface principale
│   ├── parametres.html      # Paramètres utilisateur
│   └── readme.md
│
└── messagerie-backend/      # Backend Node.js
    ├── serveur_auth.js      # Serveur principal
    ├── package.json
    ├── package-lock.json
    └── node_modules/
```

---

## ⚙️ Installation & Lancement

### 1. Cloner le dépôt
```bash
git clone https://gitlab.com/ton-utilisateur/messagerie.git
cd messagerie
```

### 2. Backend
```bash
cd messagerie-backend
npm install
npm start   # ou pm2 start serveur_auth.js
```

### 3. Frontend
Déployer le contenu du dossier `messagerie/` sur un serveur web (Nginx, Apache ou simple `live-server`).

### 4. Configuration
- PostgreSQL doit être configuré avec la base `messagerie` et les tables nécessaires (utilisateurs, contacts, groupes, messages…).
- Adapter les variables de connexion dans `serveur_auth.js`.

---

## 📸 Aperçu

- Messagerie classique (discussions, contacts, groupes)
- Partie Waw immersive (tour de messages 3D)

---

## 📌 Roadmap

- [x] Authentification (inscription / connexion).
- [x] Sauvegarde et affichage des messages privés en temps réel.
- [ ] Mode clair / sombre.
- [ ] Gestion complète des contacts (envoi / acceptation / refus).
- [ ] Groupes (création, ajout/suppression de membres).
- [ ] Partie Waw (intégration finale avec animations GSAP).
- [ ] Sécurité supplémentaire (hash mots de passe, validation des données).

---

## Auteur
Projet développé par **Anas SIBARNI** (2025).  

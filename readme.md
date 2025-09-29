# si-chat.app

## Vue d'ensemble

**si-chat** est une messagerie web temps réel avec : - **Discussions
privées** et **groupes**.\
- **Système de contacts** (demandes, acceptation, ouverture auto du
chat).\
- **Profil** (pp, description).\
- **Thème clair/sombre**.\
- **Chargement court** (≤ 2 s).

------------------------------------------------------------------------

## Architecture

-   **Frontend** : HTML5, CSS3, JavaScript (Vanilla), Socket.IO client.\
-   **Temps réel** : WebSocket via **Socket.IO**.\
-   **Backend** : Node.js + Express, Socket.IO serveur.\
-   **BDD** : PostgreSQL (comptes, contacts, messages, groupes).\
-   **Infra** : OVH VPS, domaine **si-chat.app**, **Nginx** (reverse
    proxy), **PM2** (process manager), **HTTPS** avec Let's Encrypt.

------------------------------------------------------------------------

## Arborescence

**Frontend `messagerie/`**

    img/     (pp, visuels)
    css/     (style global, messagerie, paramètres)
    scripts/ (auth.js, contacts.js, groups.js, main.js, ui.js, ...)
    index.html
    login.html
    register.html
    messagerie.html
    parametres.html

**Backend `messagerie-backend/`**

    serveur_auth.js   (serveur Express + Socket.IO)
    package.json
    package-lock.json
    node_modules/

------------------------------------------------------------------------

## Fonctionnalités en place

-   **Auth** : inscription, connexion.\
-   **Messagerie** : sauvegarde et récupération des messages depuis
    PostgreSQL, temps réel via Socket.IO.\
-   **Interface** : pp visibles, liste des conversations privées et groupes.\
-   **Contacts** : affichage des contacts en ligne et autres, ajout de contact, accepter/refuser demande
-   **Groupes** : ouverture par un initiateur, ajout de
    membres, messages diffusés à tous.\
-   **Profil / paramètres** : changement du pseudo, du mot de passe, de l'adresse e-mail.

------------------------------------------------------------------------

## Base de données

Tables principales :\
- `users` → infos compte (username, email, hash, pp, description,
en_ligne).\
- `private_messages` → messages privés entre deux utilisateurs.\
- `groups`, `group_members`, `group_messages` → gestion des groupes.\
- `contact_requests` → demandes de contacts avec statut.\
- `dm_read_state` → suivi lecture des DM.


------------------------------------------------------------------------

## Déploiement

-   **Backend** : Node.js/Express/Socket.IO, lancé avec **PM2**
    (`pm2 start serveur_auth.js --name si-chat-api`).\
-   **Frontend** : fichiers statiques servis par **Nginx**\
-   **Proxy** Nginx pour API (`/api/`) et Socket.IO (`/socket.io/`).\
-   **HTTPS** : Let's Encrypt configuré, renouvellement auto.\
-   **PostgreSQL** : hébergé sur le même VPS.

------------------------------------------------------------------------

## Git

-   Dépôt GitLab.\

------------------------------------------------------------------------

# si-chat.app --- descriptif technique

## Vue d'ensemble

**si-chat** est une messagerie web temps réel avec : - **Discussions
privées** et **groupes**.\
- **Système de contacts** (demandes, acceptation, ouverture auto du
chat).\
- **Profil** (pp, description).\

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

**Frontend `Public`**

    img/     
    css/     
    scripts/ 
    index.html
    login.html
    register.html
    messagerie.html
    parametres.html

**Backend `Privé`**

------------------------------------------------------------------------

## Fonctionnalités en place

-   **Auth** : inscription, connexion.\
-   **Messagerie** : sauvegarde et récupération des messages depuis
    PostgreSQL, temps réel via Socket.IO.\
-   **Interface** : photo de profil visibles, liste des conversations privées et groupes.\
-   **Contacts** : affichage des contacts en ligne et hors ligne (séparemment)
-   **Groupes** : ouverture par un initiateur, ajout de membres, messages diffusés à tous.\
-   **Profil / paramètres** : changement du pseudo, mot de passe, changement d'adresse e-mail, suppression compte\

------------------------------------------------------------------------

## Base de données
`Privé`


------------------------------------------------------------------------

## Déploiement

-   **Backend** : Node.js/Express/Socket.IO, lancé avec **PM2**\
-   **Frontend** : fichiers statiques servis par **Nginx**\
-   **Proxy** Nginx pour API (`/api/`) et Socket.IO (`/socket.io/`).\
-   **HTTPS** : Let's Encrypt configuré, renouvellement auto.\
-   **PostgreSQL** : hébergé sur le même VPS.

------------------------------------------------------------------------

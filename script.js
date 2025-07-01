// script.js complet associé à la messagerie avec pp corrigée

const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username');
let activeContactId = null;
let activeContactName = '';
let lastMessageIds = [];

if (!userId || !username) {
  alert("Veuillez vous connecter.");
  window.location.href = "login.html";
}

document.getElementById("username").textContent = username;

function switchTab(tab) {
  document.querySelectorAll('.tabs .nav button').forEach(btn => btn.classList.remove('active'));
  const tabBtn = document.getElementById(`tab-${tab}`);
  if (tabBtn) tabBtn.classList.add('active');

  const content = document.getElementById('tab-content');
  content.innerHTML = '';

  if (tab === 'pending') {
    fetch(`http://localhost:3001/friend-requests/${userId}`)
      .then(res => res.json())
      .then(requests => {
        const content = document.getElementById('tab-content');
        content.innerHTML = '';
        requests.forEach(req => {
          const div = document.createElement('div');
          div.classList.add('contact-item');
          div.innerHTML = `
            <div class="pp" style="background-image:url('${req.sender_pp || 'default.jpg'}'); background-size:cover; background-position:center;"></div>
            <span>${req.sender_username}</span>
            <div style="margin-left:auto;">
              <button onclick="repondreDemande(${req.id}, 'accepte')">✔️</button>
              <button onclick="repondreDemande(${req.id}, 'refuse')">❌</button>
            </div>
          `;
          content.appendChild(div);
        });
      });
  } else if (tab === 'add') {
    content.innerHTML = `
      <div class="add-contact-container">
        <form class="form-inline" onsubmit="addContact(event)">
          <input type="text" id="new-contact" placeholder="Nom d'utilisateur à ajouter...">
          <button type="submit">Ajouter</button>
        </form>
        <p id="add-result" class="add-result-message"></p>
      </div>
    `; 
  } else if (tab === 'online') {
    fetch(`http://localhost:3001/friends-online/${userId}`)
      .then(res => res.json())
      .then(friends => {
        const contentList = friends.map(f => `
          <li>
            <div class="pp" style="background-image:url('${f.pp || 'default.jpg'}'); background-size:cover; background-position:center;"></div>
            ${f.username}
          </li>`).join('');
        content.innerHTML = '<ul>' + contentList + '</ul>';
      });
  } else if (tab === 'groups') {
    const content = document.getElementById('tab-content');
    content.innerHTML = `
      <button class="btn-new-group" onclick="showNewGroupForm()">➕ Nouveau groupe</button>
      <div id="user-groups-list"></div>
    `;
    loadUserGroups();
  } else {
    fetch(`http://localhost:3001/friends/${userId}`)
      .then(res => res.json())
      .then(friends => {
        const contentList = friends.map(f => `
          <li>
            <div class="pp" style="background-image:url('${f.pp || 'default.jpg'}'); background-size:cover; background-position:center;"></div>
            ${f.username}
          </li>`).join('');
        content.innerHTML = '<ul>' + contentList + '</ul>';
      });};}


function showContactSection() {
  document.getElementById('contact-section').classList.remove('hidden');
  document.getElementById('chat-area').classList.add('hidden');
}

function addContact(e) {
  e.preventDefault();
  const input = document.getElementById('new-contact').value;
  fetch('http://localhost:3001/friend-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderId: userId, receiverUsername: input })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('add-result').textContent = data.message || data.error;
  });
}

function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('message-input');
  const msg = input.value.trim();
  if (!msg || !activeContactId) return;

  fetch('http://localhost:3001/private-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderId: userId,
      receiverId: activeContactId,
      content: msg
    })
  })
  .then(res => res.json())
  .then(() => {
    input.value = '';
    loadPrivateDiscussion(activeContactId, activeContactName);
  });
}

function loadContactsInSidebar() {
  const container = document.getElementById('contact-list-sidebar');
  container.innerHTML = '';

  // Charger les contacts privés
  fetch(`http://localhost:3001/friends/${userId}`)
    .then(res => res.json())
    .then(friends => {
      friends.forEach(friend => {
        const div = document.createElement('div');
        div.classList.add('contact-item');
        div.innerHTML = `
          <div class="pp"></div>
          <span>${friend.username}</span>
        `;
        const ppBox = div.querySelector('.pp');
        ppBox.style.backgroundImage = `url('${friend.pp || 'default.jpg'}')`;
        ppBox.style.backgroundSize = 'cover';
        ppBox.style.backgroundPosition = 'center';
        div.onclick = () => loadPrivateDiscussion(friend.id, friend.username);
        container.appendChild(div);
      });
    });

  // Charger les groupes
  fetch(`http://localhost:3001/groups/${userId}`)
    .then(res => res.json())
    .then(groups => {
      groups.forEach(group => {
        const div = document.createElement('div');
        div.classList.add('contact-item');
        div.innerHTML = `
          <div class="pp" style="background-color:#444;">💬</div>
          <span>${group.name}</span>
        `;
        div.onclick = () => openGroupChat(group.id, group.name);
        container.appendChild(div);
      });
    });
}


fetch(`http://localhost:3001/user/${userId}`)
  .then(res => res.json())
  .then(user => {
    const mePp = document.querySelector('.contact-item .pp');
    if (mePp) {
      mePp.style.backgroundImage = `url(${user.pp || 'default.jpg'})`;
      mePp.style.backgroundSize = 'cover';
      mePp.style.backgroundPosition = 'center';
    }
  });

function loadPrivateDiscussion(contactId, contactName) {
  console.log("Chargement de la discussion avec :", contactId, contactName);

  activeContactId = contactId;
  activeContactName = contactName;

  document.getElementById('contact-section').classList.add('hidden');
  document.getElementById('chat-area').classList.remove('hidden');
  document.getElementById('chat-user').textContent = contactName;

  fetch(`http://localhost:3001/private-messages?user1=${userId}&user2=${contactId}`)
    .then(res => res.json())
    .then(messages => {
      console.log("Messages récupérés :", messages);
      const chatBody = document.getElementById('chat-body');
      chatBody.innerHTML = '';
      lastMessageIds = messages.map(m => m.id);
      messages.forEach(m => {
        const div = document.createElement('div');
        div.classList.add('chat-message');
        div.classList.add(m.sender_id == userId ? 'me' : 'other');
        div.dataset.msgId = m.id;
        div.innerHTML = `
          <div class="pp-message" style="background-image: url('${m.sender_pp || 'default.jpg'}');"></div>
          <div class="text-block">
            <div class="sender-line">${m.sender_username} :</div>
            <div class="content-line">${m.content}</div>
          </div>
        `;

        chatBody.appendChild(div);
      });
      chatBody.scrollTop = chatBody.scrollHeight;
    });

  fetch(`http://localhost:3001/user/${contactId}`)
    .then(res => res.json())
    .then(user => {
      console.log('Données utilisateur :', user);
      document.getElementById('profile-name').textContent = user.username;
      document.getElementById('profile-description').textContent = `Description : ${user.description || 'Aucune description'}`;

      const ppDiv = document.querySelector('#contact-profile .pp');
      if (ppDiv) {
        ppDiv.style.backgroundImage = `url(${user.pp || 'default.jpg'})`;
        ppDiv.style.backgroundSize = 'cover';
        ppDiv.style.backgroundPosition = 'center';
      }
    });

  if (window.messageRefreshInterval) clearInterval(window.messageRefreshInterval);
  window.messageRefreshInterval = setInterval(() => {
    if (activeContactId === contactId) {
      fetch(`http://localhost:3001/private-messages?user1=${userId}&user2=${contactId}`)
        .then(res => res.json())
        .then(messages => {
          const newIds = messages.map(m => m.id);
          const isNew = m => !lastMessageIds.includes(m.id);
          lastMessageIds = newIds;

          const chatBody = document.getElementById('chat-body');
          const existing = Array.from(chatBody.children).map(div => div.dataset.msgId);

          messages.forEach(m => {
            if (existing.includes(String(m.id))) return;
            const div = document.createElement('div');
            div.classList.add('chat-message');
            div.classList.add(m.sender_id == userId ? 'me' : 'other');
            div.dataset.msgId = m.id;
            div.textContent = `${m.sender_username} : ${m.content}`;
            chatBody.appendChild(div);
          });

          chatBody.scrollTop = chatBody.scrollHeight;
        });
    }
  }, 1000);
}

function toggleProfileMenu() {
  document.getElementById('profile-menu').classList.toggle('hidden');
}

function toggleSettingsMenu() {
  document.getElementById('settings-menu').classList.toggle('hidden');
}

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


function repondreDemande(id, reponse) {
  fetch('http://localhost:3001/friend-request/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: id, response: reponse })
  })
    .then(res => res.json())
    .then(() => {
      alert(`Demande ${reponse === 'accepte' ? 'acceptée' : 'refusée'}`);
      switchTab('pending');
    });
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('chat-user').textContent = "Discussion privée la plus récente";
  document.getElementById('contact-section').classList.remove('hidden'); // on AFFICHE les onglets
  document.getElementById('chat-area').classList.add('hidden'); // on CACHE le chat
  loadContactsInSidebar();
});



function logout() {
  fetch(`http://localhost:3001/logout/${userId}`, { method: 'POST' })
    .then(() => {
      localStorage.clear();
      window.location.href = 'login.html';
    });
}

function loadUserGroups() {
  fetch(`http://localhost:3001/groups/${userId}`)
    .then(res => res.json())
    .then(groups => {
      const list = document.getElementById('user-groups-list');
      list.innerHTML = '';
      groups.forEach(g => {
        const div = document.createElement('div');
        div.classList.add('contact-item');
        div.textContent = "💬 " + g.name;
        div.onclick = () => openGroupChat(g.id, g.name);
        list.appendChild(div);
      });
    });
}
function showNewGroupForm() {
  const content = document.getElementById('tab-content');
  content.innerHTML = `
    <div class="group-form-container">
      <h3>Ouvrir un nouveau groupe</h3>
      <form onsubmit="newGroup(event)" class="group-form">
        <input type="text" id="group-name" placeholder="Nom du groupe" required>
        <div id="group-contact-selection" class="contact-checkbox-list">Chargement des contacts...</div>
        <button type="submit" class="btn-group">Nouveau</button>
        <p id="group-new-result" class="group-new-result"></p>
      </form>
    </div>
  `;

  // Charger les contacts
  fetch(`http://localhost:3001/friends/${userId}`)
    .then(res => res.json())
    .then(friends => {
      const listDiv = document.getElementById('group-contact-selection');
      listDiv.innerHTML = '';

      friends.forEach(f => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.marginBottom = '0.5rem';

        label.innerHTML = `
          <input type="checkbox" name="group-members" value="${f.id}" style="margin-right: 0.5rem;">
          <div class="pp" style="background-image:url('${f.pp || 'default.jpg'}'); background-size:cover; background-position:center; margin-right: 0.5rem;"></div>
          <span>${f.username}</span>
        `;

        listDiv.appendChild(label);
      });
    });
}

function newGroup(e) {
  e.preventDefault();
  const name = document.getElementById('group-name').value.trim();

  // récupérer les contacts sélectionnés
  const selected = Array.from(document.querySelectorAll('input[name="group-members"]:checked')).map(cb => parseInt(cb.value));

  if (selected.length < 2) {
    document.getElementById('group-new-result').textContent = "Veuillez sélectionner au moins 2 contacts.";
    return;
  }

  fetch('http://localhost:3001/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, directorId: userId, memberIds: selected })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('group-new-result').textContent = data.message || 'Nouveau groupe.';
    switchTab('groups');
  })
  .catch(err => {
    console.error(err);
    document.getElementById('group-new-result').textContent = "Erreur lors de tentative nouveau du groupe.";
  });
}

function showGroupSection() {
  document.getElementById('chat-area').classList.add('hidden');
  switchTab('groups'); // on affiche la section groupes
}

function openGroupChat(groupId, groupName) {
  activeContactId = null;
  document.getElementById('chat-user').textContent = `[Groupe] ${groupName}`;
  document.getElementById('contact-section').classList.add('hidden');
  document.querySelectorAll('.tabs .nav button').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-content').innerHTML = '';
  

  document.getElementById('chat-area').classList.remove('hidden');

  fetch(`http://localhost:3001/group-messages/${groupId}`)
    .then(res => res.json())
    .then(messages => {
      const chatBody = document.getElementById('chat-body');
      chatBody.innerHTML = '';
      messages.forEach(m => {
        const div = document.createElement('div');
        div.classList.add('chat-message', m.sender_id == userId ? 'me' : 'other');
        div.innerHTML = `
          <div class="pp-message" style="background-image: url('${m.sender_pp || 'default.jpg'}');"></div>
          <div class="text-block">
            <div class="sender-line">${m.sender_username} :</div>
            <div class="content-line">${m.content}</div>
          </div>
        `;
        chatBody.appendChild(div);
      });
      chatBody.scrollTop = chatBody.scrollHeight;
    });

  // envoyer un message dans le groupe
  document.querySelector('.chat-footer').onsubmit = e => {
    e.preventDefault();
    const msg = document.getElementById('message-input').value.trim();
    if (!msg) return;

    fetch('http://localhost:3001/group-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, senderId: userId, content: msg })
    })
    .then(() => {
      document.getElementById('message-input').value = '';
      openGroupChat(groupId, groupName);
    });
  };

  // Charger les membres du groupe
  fetch(`http://localhost:3001/groups/${groupId}/members`)
  .then(res => res.json())
  .then(members => {
    const profile = document.getElementById('contact-profile');
    profile.innerHTML = `
      <h4>Membres du groupe</h4>
      <ul class="group-members-list"></ul>
    `;
    const list = profile.querySelector('.group-members-list');
    members.forEach(m => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.marginBottom = '0.75rem';
      li.innerHTML = `
        <div class="pp" style="background-image:url('${m.pp || 'default.jpg'}'); background-size:cover; background-position:center; margin-right:0.75rem;"></div>
        <div>
          <strong>${m.username}</strong><br>
          <span style="font-size: 0.85rem; color: #aaa;">${m.description || 'Aucune description'}</span>
        </div>
      `;
      list.appendChild(li);
    });
  });

}

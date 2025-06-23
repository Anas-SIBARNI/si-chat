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

  if (tab === 'add') {
    content.innerHTML = `
      <form class="form-inline" onsubmit="addContact(event)">
        <input type="text" id="new-contact" placeholder="Entrer le nom d'utilisateur...">
        <button type="submit">Ajouter</button>
      </form>
      <p id="add-result"></p>
    `;
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
      });
  }
}

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
  fetch(`http://localhost:3001/friends/${userId}`)
    .then(res => res.json())
    .then(friends => {
      const container = document.getElementById('contact-list-sidebar');
      container.innerHTML = '';
      friends.forEach(friend => {
        const div = document.createElement('div');
        div.classList.add('contact-item');
        div.innerHTML = `
          <div class="pp"></div>
          <span>${friend.username}</span>
        `;
        const ppBox = div.querySelector('.pp');
        if (ppBox) {
          ppBox.style.backgroundImage = `url('${friend.pp || 'default.jpg'}')`;
          ppBox.style.backgroundSize = 'cover';
          ppBox.style.backgroundPosition = 'center';
        }
        div.onclick = () => loadPrivateDiscussion(friend.id, friend.username);
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
  if (contactId === activeContactId && document.getElementById('chat-body').children.length > 0) return;

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

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('chat-user').textContent = "Discussion privée la plus récente";
  document.getElementById('contact-section').classList.add('hidden');
  document.getElementById('chat-area').classList.remove('hidden');
  loadContactsInSidebar();
});

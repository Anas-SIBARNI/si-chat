var userId = localStorage.getItem("userId");
var username = localStorage.getItem("username");

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
  const content = input.value.trim();
  if (!content || !activeContactId) return;

  const data = {
    senderId: localStorage.getItem("userId"),
    receiverId: activeContactId,
    content: content,
    timestamp: new Date().toISOString(),
    sender: localStorage.getItem("username")
  };

  socket.emit('privateMessage', data);
  input.value = "";
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
        ppBox.style.backgroundImage = `url('${friend.pp || '../img/default.jpg'}')`;
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
      mePp.style.backgroundImage = `url(${user.pp || '../img/default.jpg'})`;
      mePp.style.backgroundSize = 'cover';
      mePp.style.backgroundPosition = 'center';
    }
  });

function loadPrivateDiscussion(contactId, contactName) {
  console.log("Chargement de la discussion avec :", contactId, contactName);

  window.activeContactId = contactId;
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
          <div class="pp-message" style="background-image: url('${m.sender_pp || '../img/default.jpg'}');"></div>
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
        ppDiv.style.backgroundImage = `url(${user.pp || '../img/default.jpg'})`;
        ppDiv.style.backgroundSize = 'cover';
        ppDiv.style.backgroundPosition = 'center';
      }
    });
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

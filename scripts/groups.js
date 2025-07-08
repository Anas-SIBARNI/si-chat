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
          <div class="pp" style="background-image:url('${f.pp || '../img/default.jpg'}'); background-size:cover; background-position:center; margin-right: 0.5rem;"></div>
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
  window.activeGroupId = groupId;

  activeGroupId = groupId;
  activeContactId = null;

  socket.emit("joinGroup", groupId);

  document.getElementById('chat-user').textContent = `[Groupe] ${groupName}`;
  document.getElementById('group-options-toggle').onclick = () => {
    document.getElementById('group-options-menu').classList.toggle('hidden');
  };

  document.getElementById('contact-section').classList.add('hidden');
  document.querySelectorAll('.tabs .nav button').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-content').innerHTML = '';
  document.getElementById('chat-area').classList.remove('hidden');

  // Chargement historique messages
  fetch(`http://localhost:3001/group-messages/${groupId}`)
    .then(res => res.json())
    .then(messages => {
      const chatBody = document.getElementById('chat-body');
      chatBody.innerHTML = '';
      messages.forEach(m => {
        const div = document.createElement('div');
        div.classList.add('chat-message', m.sender_id == userId ? 'me' : 'other');
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

  // Envoi d’un message via socket
  document.querySelector('.chat-footer').onsubmit = e => {
    e.preventDefault();
    const msg = document.getElementById('message-input').value.trim();
    if (!msg) return;

    socket.emit('groupMessage', {
      groupId,
      senderId: userId,
      content: msg,
      sender: localStorage.getItem('username'),
      timestamp: new Date().toISOString()
    });

    document.getElementById('message-input').value = '';
  };

  // Chargement des membres du groupe
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
          <div class="pp" style="background-image:url('${m.pp || '../img/default.jpg'}'); background-size:cover; background-position:center; margin-right:0.75rem;"></div>
          <div>
            <strong>${m.username}</strong><br>
            <span style="font-size: 0.85rem; color: #aaa;">${m.description || 'Aucune description'}</span>
          </div>
        `;
        list.appendChild(li);
      });
    });
}


function changeGroupName(groupId) {
  const newName = prompt("Nouveau nom du groupe :");
  if (!newName) return;

  fetch(`http://localhost:3001/groups/${groupId}/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName })
  })
    .then(res => res.json())
    .then(() => openGroupChat(groupId, newName))
    .catch(() => alert("Erreur lors du renommage"));
}
function removeMemberPrompt(groupId) {
  const username = prompt("Nom d'utilisateur à retirer :");
  if (!username) return;

  fetch(`http://localhost:3001/groups/${groupId}/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Membre retiré");
      openGroupChat(groupId, document.getElementById('chat-user').textContent);
    })
    .catch(() => alert("Erreur lors du retrait"));
}
function quitGroup(groupId) {
  if (!confirm("Tu es sûr de vouloir quitter ce groupe ?")) return;

  fetch(`http://localhost:3001/groups/${groupId}/quit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
    .then(res => res.json())
    .then(() => {
      alert("Tu as quitté le groupe.");
      location.reload();
    })
    .catch(() => alert("Erreur"));
}
function deleteGroup(groupId) {
  if (!confirm("Supprimer ce groupe ?")) return;

  fetch(`http://localhost:3001/groups/${groupId}/delete`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(() => {
      alert("Groupe supprimé.");
      location.reload();
    })
    .catch(() => alert("Erreur"));
}

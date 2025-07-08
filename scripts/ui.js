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
            <div class="pp" style="background-image:url('${req.sender_pp || '../img/default.jpg'}'); background-size:cover; background-position:center;"></div>
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
            <div class="pp" style="background-image:url('${f.pp || '../img/default.jpg'}'); background-size:cover; background-position:center;"></div>
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
            <div class="pp" style="background-image:url('${f.pp || '../img/default.jpg'}'); background-size:cover; background-position:center;"></div>
            ${f.username}
          </li>`).join('');
        content.innerHTML = '<ul>' + contentList + '</ul>';
      });};}


function showContactSection() {
  document.getElementById('contact-section').classList.remove('hidden');
  document.getElementById('chat-area').classList.add('hidden');
}

function toggleProfileMenu() {
  document.getElementById('profile-menu').classList.toggle('hidden');
}

function toggleSettingsMenu() {
  document.getElementById('settings-menu').classList.toggle('hidden');
}


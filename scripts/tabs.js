if (!window.userId) {
    window.userId = localStorage.getItem('userId');
  }
  

// Quand on clique sur  Discussions
document.getElementById('nav-discussions').addEventListener('click', () => {
    document.getElementById('discussions-section').style.display = 'block'; // discussions
    document.getElementById('group-section').style.display = 'none';    // groupes
  });

  // Quand on clique sur  Groupes
  document.getElementById('nav-groups').addEventListener('click', () => {
    document.getElementById('discussions-section').style.display = 'none';  // discussions
    document.getElementById('group-section').style.display = 'block';   // groupes
    loadUserGroups(); // appel direct à ta fonction groups.js
  });


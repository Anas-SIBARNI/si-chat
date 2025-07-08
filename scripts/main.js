
var userId = localStorage.getItem("userId");
var username = localStorage.getItem('username');

let activeGroupId = null;
let activeContactId = null;
let activeContactName = '';

window.activeContactId = null;
window.activeGroupId = null;


if (!userId || !username) {
  alert("Veuillez vous connecter.");
  window.location.href = "login.html";
}

document.getElementById("username").textContent = username;

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('chat-user').textContent = "Discussion privée la plus récente";
  document.getElementById('contact-section').classList.remove('hidden'); // on AFFICHE les onglets
  document.getElementById('chat-area').classList.add('hidden'); // on CACHE le chat
  loadContactsInSidebar();
});



// websocket

const socket = io("http://localhost:3001");
socket.emit("registerUser", userId);
console.log("✅ registerUser envoyé pour", userId);


socket.on("privateMessage", (data) => {
  console.log("🔔 message privé reçu via socket:", data);
  console.log("activeContactId:", window.activeContactId, "senderId:", data.senderId, "receiverId:", data.receiverId);

  if (
    parseInt(window.activeContactId) === data.senderId ||
    parseInt(window.activeContactId) === data.receiverId
  ) {
    console.log("✅ Affichage du message dans le chat");
    displayMessage(data);
    scrollChatToBottom();
  } else {
    console.log("📨 Nouveau message privé reçu hors discussion active. Rechargement automatique...");

    // Affiche directement la discussion si l'utilisateur est destinataire
    if (parseInt(userId) === data.receiverId && parseInt(window.activeContactId) !== data.senderId) {
      loadPrivateDiscussion(data.senderId, data.sender);
      setTimeout(() => {
        document.getElementById('contact-section').classList.add('hidden');
        document.getElementById('chat-area').classList.remove('hidden');
      }, 200);
    }
    
    
  }
});






socket.on("groupMessage", (data) => {
  console.log("🔔 message reçu via socket.io :", data);

  if (parseInt(window.activeGroupId) === data.groupId) {
    displayMessage(data);
    const chatBody = document.getElementById("chat-body");
    const isAtBottom = chatBody.scrollHeight - chatBody.scrollTop <= chatBody.clientHeight + 50;
    if (isAtBottom) chatBody.scrollTop = chatBody.scrollHeight;
  }
});

function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById("message-input");
  const content = input.value.trim();
  if (!content) return;

  if (activeContactId) {
    socket.emit("privateMessage", {
      senderId: userId,
      receiverId: activeContactId,
      content,
      timestamp: new Date().toISOString(),
      sender: localStorage.getItem("username")
    });
  } else if (activeGroupId) {
    socket.emit("groupMessage", {
      senderId: userId,
      groupId: activeGroupId,
      content,
      timestamp: new Date().toISOString(),
      sender: localStorage.getItem("username")
    });
  }

  input.value = "";
}

function displayMessage(data) {
  const chatBody = document.getElementById("chat-body");
  const div = document.createElement("div");
  div.classList.add("chat-message", data.senderId == userId ? "me" : "other");
  div.innerHTML = `
    <div class="pp-message" style="background-image:url('img/default.jpg');"></div>
    <div class="text-block">
      <div class="sender-line">${data.sender} :</div>
      <div class="content-line">${data.content}</div>
    </div>
  `;
  chatBody.appendChild(div);
}



function scrollChatToBottom() {
  const chatBody = document.getElementById("chat-body");
  chatBody.scrollTop = chatBody.scrollHeight;
}

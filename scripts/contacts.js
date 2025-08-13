// scripts/contacts.js (FIX)

function __getUserId() {
  // on lit celui posé par main.js si dispo, sinon fallback localStorage
  return window.userId || localStorage.getItem("userId");
}

// ---- API: envoyer une demande d'ami (optionnel)
function addContact(e) {
  e.preventDefault();
  const input = document.getElementById("new-contact");
  const receiverUsername = input ? input.value.trim() : "";
  if (!receiverUsername) return;

  fetch("http://localhost:3001/friend-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId: __getUserId(), receiverUsername })
  })
    .then(r => r.json())
    .then(data => {
      const box = document.getElementById("add-result");
      if (box) box.textContent = data.message || data.error || "";
    })
    .catch(() => {
      const box = document.getElementById("add-result");
      if (box) box.textContent = "Erreur réseau";
    });
}

function renderContactItem(friend) {
  const li = document.createElement("li");
  li.classList.add("contact");
  li.dataset.id = friend.id;
  li.dataset.username = friend.username;

  const statusClass = friend.isOnline ? "online" : "offline";
  const pp = (friend.pp || "img/default.jpg").replace(/"/g, "&quot;");
  const name = String(friend.username || "").replace(/</g, "&lt;");

  li.innerHTML = `
    <div class="pp ${statusClass}" style="
      background-image:url('${pp}');
      background-size:cover;background-position:center;
    "></div>
    <div>
      <strong>${name}</strong>
      <p>${friend.isOnline ? "En ligne" : "Hors ligne"}</p>
    </div>
  `;

  li.addEventListener("click", () => {
    if (typeof loadPrivateDiscussion === "function") {
      loadPrivateDiscussion(friend.id, friend.username);
      document.getElementById("contact-section")?.classList.add("hidden");
      document.getElementById("chat-area")?.classList.remove("hidden");
    }
  });

  return li;
}

async function loadContacts() {
  const list = document.getElementById("discussions-list"); // ID correct
  if (!list) {
    console.warn("[loadContacts] conteneur #discussions-list introuvable");
    return;
  }
  list.innerHTML = `<div style="padding:.6rem;color:#9aa3b2">Chargement…</div>`;

  try {
    const res = await fetch(`http://localhost:3001/friends/${__getUserId()}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const friends = await res.json();

    list.innerHTML = "";
    if (!Array.isArray(friends) || friends.length === 0) {
      list.innerHTML = `<div style="padding:.8rem;color:#9aa3b2">Aucun contact pour le moment</div>`;
      return;
    }

    friends.forEach(f => list.appendChild(renderContactItem(f)));
  } catch (e) {
    console.error(e);
    list.innerHTML = `<div style="padding:.8rem;color:#ef4444">Impossible de charger les contacts</div>`;
  }
}

window.addContact = addContact;
window.loadContacts = loadContacts;

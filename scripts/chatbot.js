// scripts/chatbot.js

// Ouvrir le chatbot
function openChatbot() {
    // Cache les autres sections
    document.getElementById('discussions-section').style.display = 'none';
    document.getElementById('group-section').style.display = 'none';
    document.getElementById('chat-area').style.display = 'none';
    document.getElementById('contacts-section').style.display = 'none';
    
    // Affiche la vue chatbot
    const chatbotView = document.getElementById('chatbot-view');
    chatbotView.style.display = 'flex';
    
    // Focus sur l'input
    document.getElementById('chatbot-input').focus();
}

// Fermer le chatbot
function closeChatbot() {
    document.getElementById('chatbot-view').style.display = 'none';
    
    // Réaffiche la vue discussions
    document.getElementById('discussions-section').style.display = 'block';
    document.getElementById('chat-area').style.display = 'flex';
}

// Envoyer un message au bot
async function sendToChatbot() {
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Désactive l'input pendant le traitement
    input.disabled = true;
    sendBtn.disabled = true;
    
    // Affiche le message de l'utilisateur
    addChatbotMessage(message, 'user');
    input.value = '';
    
    // Affiche "typing..."
    const typingId = addChatbotMessage('', 'bot', true);
    
    try {
        // Appel vers ta route Node.js backend
        const response = await fetch('/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Retire "typing..."
        const typingElement = document.getElementById(typingId);
        if (typingElement) typingElement.remove();
        
        if (data.error) {
            addChatbotMessage('Erreur : ' + data.error, 'bot');
        } else {
            addChatbotMessage(data.response, 'bot');
        }
    } catch (error) {
        const typingElement = document.getElementById(typingId);
        if (typingElement) typingElement.remove();
        addChatbotMessage('Erreur de connexion au serveur', 'bot');
        console.error('Erreur chatbot:', error);
    } finally {
        // Réactive l'input
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }
}

// Ajouter un message dans l'interface
function addChatbotMessage(text, sender, isTyping = false) {
    const chatContainer = document.getElementById('chatbot-messages');
    const msgWrapper = document.createElement('div');
    const msgId = 'msg-' + Date.now() + '-' + Math.random();
    
    msgWrapper.id = msgId;
    msgWrapper.className = `chatbot-message ${sender}`;
    
    if (isTyping) {
        msgWrapper.classList.add('typing');
        const contentLine = document.createElement('div');
        contentLine.className = 'content-line';
        contentLine.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        msgWrapper.appendChild(contentLine);
    } else {
        const contentLine = document.createElement('div');
        contentLine.className = 'content-line';
        contentLine.textContent = text;
        msgWrapper.appendChild(contentLine);
    }
    
    chatContainer.appendChild(msgWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return msgId;
}

// Effacer l'historique
function clearChatbotHistory() {
    if (confirm('Effacer tout l\'historique du chatbot ?')) {
        document.getElementById('chatbot-messages').innerHTML = '';
        addChatbotMessage('Bonjour ! Vous avez une question ?', 'bot');
    }
}
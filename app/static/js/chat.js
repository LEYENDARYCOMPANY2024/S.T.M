document.addEventListener('DOMContentLoaded', function() {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const typingIndicator = document.getElementById('typingIndicator');
    
    // ID de usuario (puedes obtenerlo de la sesión o cookie)
    const userId = getCookie('user_id') || 'default_user';
    
    // Crear conexión WebSocket
    const socket = new WebSocket(`ws://${window.location.host}/ws/chat/${userId}`);
    
    // Cargar mensajes anteriores al iniciar
    loadPreviousMessages();
    
    // Manejar eventos WebSocket
    socket.onopen = function(e) {
        console.log('Conexión WebSocket establecida');
    };
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        addMessageToUI(data.sender_type, data.content);
        scrollToBottom();
    };
    
    socket.onclose = function(event) {
        if (event.wasClean) {
            console.log(`Conexión cerrada limpiamente, código=${event.code} razón=${event.reason}`);
        } else {
            console.log('Conexión interrumpida');
            // Intentar reconectar después de un tiempo
            setTimeout(() => {
                location.reload();
            }, 3000);
        }
    };
    
    socket.onerror = function(error) {
        console.log(`Error WebSocket: ${error.message}`);
    };
    
    // Enviar mensaje al hacer clic en el botón o presionar Enter
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
<<<<<<< HEAD
    
    function loadPreviousMessages() {
=======
});   



document.addEventListener('DOMContentLoaded', function() {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const typingIndicator = document.getElementById('typingIndicator');
    
    // Cargar mensajes al iniciar
    loadMessages();
    
    // Enviar mensaje al hacer clic en el botón o presionar Enter
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    function loadMessages() {
>>>>>>> pruebas2
        fetch('/api/messages')
            .then(response => response.json())
            .then(messages => {
                messages.forEach(message => {
                    addMessageToUI(message.sender_type, message.content);
                });
                scrollToBottom();
            })
            .catch(error => console.error('Error cargando mensajes:', error));
    }
    
    function sendMessage() {
        const messageText = messageInput.value.trim();
<<<<<<< HEAD
        if (messageText === '' || socket.readyState !== WebSocket.OPEN) return;
        
        // Limpiar input
        messageInput.value = '';
=======
        if (messageText === '') return;
        
        // Agregar mensaje a la UI
        addMessageToUI('user', messageText);
        messageInput.value = '';
        scrollToBottom();
>>>>>>> pruebas2
        
        // Mostrar indicador de escritura
        typingIndicator.style.display = 'flex';
        
<<<<<<< HEAD
        // Enviar mensaje a través de WebSocket
        socket.send(JSON.stringify({
            message: messageText,
            userId: userId
        }));
=======
        // Enviar mensaje al servidor
        fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: messageText }),
        })
        .then(response => response.json())
        .then(data => {
            // Ocultar indicador de escritura
            typingIndicator.style.display = 'none';
            
            // Mostrar respuesta
            addMessageToUI('system', data.message);
            scrollToBottom();
        })
        .catch(error => {
            console.error('Error:', error);
            typingIndicator.style.display = 'none';
        });
>>>>>>> pruebas2
    }
    
    function addMessageToUI(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'system-message');
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.textContent = text;
        
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
    }
    
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
<<<<<<< HEAD
    
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
=======
>>>>>>> pruebas2
});
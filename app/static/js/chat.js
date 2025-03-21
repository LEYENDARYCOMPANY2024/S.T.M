document.addEventListener("DOMContentLoaded", function () {
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const messagesContainer = document.getElementById("messagesContainer");
    const typingIndicator = document.getElementById("typingIndicator");

    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText === "") return;

        // Mostrar las burbujas de escritura
        typingIndicator.style.display = "block";

        // Simula que el sistema está escribiendo
        setTimeout(() => {
            // Crear el mensaje
            const messageElement = document.createElement("div");
            messageElement.classList.add("message", "sent");
            messageElement.innerHTML = ` 
                <div class="message-content">${messageText}</div>
                <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            `;

            // Añadir mensaje al contenedor
            messagesContainer.appendChild(messageElement);
            messageInput.value = "";
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Ocultar las burbujas de escritura después de un tiempo
            typingIndicator.style.display = "none";
        }, ); // Retraso reducido a 0.5 segundos (500 ms)
    }

    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
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
        if (messageText === '') return;
        
        // Agregar mensaje a la UI
        addMessageToUI('user', messageText);
        messageInput.value = '';
        scrollToBottom();
        
        // Mostrar indicador de escritura
        typingIndicator.style.display = 'flex';
        
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
});
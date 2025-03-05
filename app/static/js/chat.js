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

document.addEventListener('DOMContentLoaded', async function () {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const typingIndicator = document.getElementById('typingIndicator');

    const remitente = "terapeuta"; // 👈 Enum que espera el backend
    const idTerapeuta = localStorage.getItem("id_terapeuta");
    const pacienteId = localStorage.getItem("id_paciente");
    let chatId = localStorage.getItem("chat_id");

    if (!idTerapeuta || !pacienteId) {
        console.error("❌ Faltan id_terapeuta o id_paciente en localStorage.");
        mostrarMensajeSistema("No se pudo iniciar el chat. Selecciona un paciente primero.");
        return;
    }

    // 🧠 Crear chat si no existe
    if (!chatId) {
        try {
            const res = await fetch(`/chat/crear?terapeuta_id=${idTerapeuta}&paciente_id=${pacienteId}`, {
                method: "POST"
            });

            if (!res.ok) throw new Error("No se pudo crear el chat");

            const data = await res.json();
            chatId = data.chat_id;
            localStorage.setItem("chat_id", chatId);
            document.body.setAttribute("data-chat-id", chatId);
            console.log("✅ Chat creado:", chatId);
        } catch (err) {
            console.error("❌ Error creando chat:", err);
            mostrarMensajeSistema("No se pudo crear el chat.");
            return;
        }
    }

    let socket;
    let isSending = false;
    let typingTimeout;

    conectarWebSocket();
    cargarMensajesAnteriores();

    sendButton.addEventListener('click', enviarMensaje);
    messageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') enviarMensaje();
    });

    messageInput.addEventListener('input', () => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ typing: true, remitente }));
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                socket.send(JSON.stringify({ typing: false, remitente }));
            }, 1500);
        }
    });

    function conectarWebSocket() {
        socket = new WebSocket(`ws://${window.location.host}/chat/ws/${chatId}`);

        socket.onopen = () => {
            console.log('✅ WebSocket conectado');
            sendButton.disabled = false;
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.typing !== undefined) {
                typingIndicator.style.display = data.typing && data.remitente !== remitente ? 'flex' : 'none';
                return;
            }

            agregarMensajeUI(data.remitente, data.mensaje, data.id_mensaje);
            scrollAlFinal();
        };

        socket.onclose = () => {
            sendButton.disabled = true;
            mostrarMensajeSistema("Conexión cerrada. Reconectando...");
            setTimeout(() => location.reload(), 3000);
        };

        socket.onerror = (error) => {
            console.error('❌ Error WebSocket:', error.message);
            mostrarMensajeSistema("Error de conexión. Esperando reconexión...");
        };
    }

    function cargarMensajesAnteriores() {
        fetch(`/chat/mensajes/${chatId}`)
            .then(res => res.json())
            .then(mensajes => {
                mensajes.forEach(msg => agregarMensajeUI(msg.remitente, msg.mensaje, msg.id_mensaje));
                scrollAlFinal();
            })
            .catch(err => console.error('❌ Error cargando historial:', err));
    }

    function enviarMensaje() {
        const mensaje = messageInput.value.trim();
        if (!mensaje || socket.readyState !== WebSocket.OPEN || isSending) return;

        isSending = true;
        messageInput.value = '';

        socket.send(JSON.stringify({ mensaje, remitente }));
        socket.send(JSON.stringify({ typing: false, remitente }));

        setTimeout(() => isSending = false, 250);
    }

    function agregarMensajeUI(remitenteMensaje, texto, idMensaje = null) {
        const mensajeDiv = document.createElement('div');
        mensajeDiv.classList.add('message', remitenteMensaje === remitente ? 'user-message' : 'system-message');

        const contenidoDiv = document.createElement('div');
        contenidoDiv.classList.add('message-content');
        contenidoDiv.textContent = texto;

        // 🗑️ Agregar botón eliminar si es terapeuta y tiene ID
        if (remitenteMensaje === remitente && idMensaje) {
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = "🗑️";
            deleteBtn.onclick = async () => {
                const confirmar = confirm("¿Eliminar este mensaje?");
                if (!confirmar) return;

                try {
                    const res = await fetch(`/chat/mensajes/${idMensaje}`, {
                        method: 'DELETE'
                    });

                    if (res.ok) {
                        mensajeDiv.remove(); // Eliminar del DOM
                    } else {
                        alert("No se pudo eliminar el mensaje.");
                    }
                } catch (err) {
                    console.error("❌ Error eliminando mensaje:", err);
                }
            };
            contenidoDiv.appendChild(deleteBtn);
        }

        mensajeDiv.appendChild(contenidoDiv);
        messagesContainer.appendChild(mensajeDiv);
    }

    function mostrarMensajeSistema(texto) {
        agregarMensajeUI('sistema', texto);
    }

    function scrollAlFinal() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    const btnInicio = document.querySelector(".home-button");

    if (btnInicio) {
        btnInicio.addEventListener("click", (e) => {
            e.preventDefault(); // ❗ Detiene el redireccionamiento inmediato        
            const overlay = document.createElement("div");
            overlay.className = "modal-overlay";

            const modal = document.createElement("div");
            modal.className = "modal-confirm";

            modal.innerHTML = `
                <h2>¿Ir al inicio?</h2>
                <p>⚠️ Si vuelves al inicio, se cerrará el chat con el paciente actual.<br>
                Los datos de conversación se mantendrán, pero se limpiará el estado de sesión.</p>
                <div class="modal-buttons">
                    <button class="btn-secondary" id="cancelarInicio">Cancelar</button>
                    <button class="btn-danger" id="confirmarInicio">Ir al inicio</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            document.getElementById("cancelarInicio").onclick = () => {
                overlay.remove();
            };

            document.getElementById("confirmarInicio").onclick = () => {
                localStorage.removeItem("chat_id");
                localStorage.removeItem("id_paciente");
                overlay.remove();
                window.location.href = "/principal";
            };
        });
    }

});

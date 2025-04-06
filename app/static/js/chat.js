<<<<<<< HEAD
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
=======
const supabase = window.supabase.createClient(
    'https://hxjmzijhcmhfcrjcptge.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4am16aWpoY21oZmNyamNwdGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwODMxODgsImV4cCI6MjA1NTY1OTE4OH0.fZ1QaYkFTfJTdupOUkV7V9a7kIIVHCt_XusnNWxkyqw'
  );

  import { verificarSesionYRedirigir } from "./verificar_sesion.js";

document.addEventListener('DOMContentLoaded', async function () {
    if (!verificarSesionYRedirigir()) return; // ⛔ Si no hay sesión, no continúa
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const typingIndicator = document.getElementById('typingIndicator');

    const remitente = "terapeuta"; // 👈 Enum que espera el backend
    const idTerapeuta = localStorage.getItem("id_terapeuta");
    const pacienteId = localStorage.getItem("id_paciente");
    let chatId = localStorage.getItem("chat_id");

    // 📌 Función para mostrar mensajes de éxito o error
    function showMessage(text, type = "success") {
        let container = document.getElementById("message-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "message-container";
            document.body.appendChild(container);
        }
    
        const message = document.createElement("div");
        message.className = `alert-message ${type}`;
    
        const icon = {
            success: "",
            error: "",
            warning: ""
        }[type] || "";
    
        message.innerHTML = `<span class="message-icon">${icon}</span> ${text}`;
        container.appendChild(message);
    
        setTimeout(() => {
            message.remove();
        }, 3000);
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
            showMessage("No se pudo crear el chat.", "error");
            return;
        }
    }

      // 👇 Escucha inserts en la tabla de mensajes
      if (chatId) {
        supabase.channel('chat_mensajes')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'mensajes'
          }, payload => {
            const msg = payload.new;
            if (msg.id_chat_m_fk === parseInt(chatId) && msg.remitente !== remitente) {
              console.log("📥 Nuevo mensaje (Realtime):", msg);
              agregarMensajeUI(msg.remitente, msg.mensaje, msg.id_mensaje, msg.enviado_en);
              scrollAlFinal();
            }
          })
          .subscribe(status => {
            if (status === 'SUBSCRIBED') {
              console.log("✅ Subscrito a Realtime de mensajes");
            }
          });
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
        socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/chat/ws/${chatId}`);

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
        
            agregarMensajeUI(data.remitente, data.mensaje, data.id_mensaje, data.fecha_envio);
            scrollAlFinal();
        };
        

        socket.onclose = () => {
            sendButton.disabled = true;
            showMessage("Conexión cerrada. Reconectando...", "warning");
            setTimeout(() => location.reload(), 3000);
        };

        socket.onerror = (error) => {
            console.error('❌ Error WebSocket:', error.message);
            showMessage("Error de conexión. Esperando reconexión...", "error");
        };
    }

    function cargarMensajesAnteriores() {
        messagesContainer.innerHTML = ""; // ✅ Aquí estaba el error tipográfico
        fetch(`/chat/mensajes/${chatId}`)
            .then(res => res.json())
            .then(mensajes => {
                mensajes.forEach(msg => {
                    agregarMensajeUI(msg.remitente, msg.mensaje, msg.id_mensaje, msg.enviado_en);
                });
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

    function agregarMensajeUI(remitenteMensaje, texto, idMensaje = null, fechaEnvio = null) {
        const mensajeDiv = document.createElement('div');
        mensajeDiv.classList.add('message', remitenteMensaje === remitente ? 'user-message' : 'system-message');

        // 👉 Detecta si es un nuevo bloque de remitente
        const ultimo = messagesContainer.lastElementChild;
        const esBloqueNuevo = !ultimo || !ultimo.classList.contains(remitenteMensaje === remitente ? 'user-message' : 'system-message');
        if (esBloqueNuevo) mensajeDiv.style.marginTop = "20px";
    
        // ✅ Asegúrate de crear primero este contenedor
        const contenidoDiv = document.createElement('div');
        contenidoDiv.classList.add('message-content');
    
        // 🧱 Texto del mensaje
        const textoDiv = document.createElement('div');
        textoDiv.textContent = texto;
        contenidoDiv.appendChild(textoDiv);
    
        // 🕒 Mostrar fecha/hora si viene incluida
        if (fechaEnvio) {
            const fecha = new Date(fechaEnvio);
            const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
            const opcionesHora = { hour: 'numeric', minute: '2-digit', hour12: true };
            const textoFecha = fecha.toLocaleDateString('es-MX', opcionesFecha);
            const textoHora = fecha.toLocaleTimeString('es-MX', opcionesHora);
    
            const timeLabel = document.createElement('div');
            timeLabel.classList.add('message-timestamp');
            timeLabel.textContent = `${textoFecha} • ${textoHora}`;
            contenidoDiv.appendChild(timeLabel);
        }
    
        // 🗑️ Botón eliminar si es terapeuta
        if (remitenteMensaje === remitente && idMensaje) {
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = "🗑️";
    
            deleteBtn.onclick = () => {
                const overlay = document.createElement("div");
                overlay.className = "modal-overlay";
    
                const modal = document.createElement("div");
                modal.className = "modal-confirm";
    
                modal.innerHTML = `
                    <h2>¿Eliminar mensaje?</h2>
                    <p>⚠️ Esta acción no se puede deshacer.<br>¿Deseas continuar?</p>
                    <div class="modal-buttons">
                        <button class="btn-secondary" id="cancelarEliminar">Cancelar</button>
                        <button class="btn-danger" id="confirmarEliminar">Eliminar</button>
                    </div>
                `;
    
                overlay.appendChild(modal);
                document.body.appendChild(overlay);
    
                document.getElementById("cancelarEliminar").onclick = () => overlay.remove();
    
                document.getElementById("confirmarEliminar").onclick = async () => {
                    try {
                        const res = await fetch(`/chat/mensajes/${idMensaje}`, {
                            method: 'DELETE'
                        });
    
                        if (res.ok) {
                            mensajeDiv.remove();
                            overlay.remove();
                        } else {
                            showMessage("No se pudo eliminar el mensaje.", "error");
                            overlay.remove();
                        }
                    } catch (err) {
                        console.error("❌ Error eliminando mensaje:", err);
                        overlay.remove();
                    }
                };
            };
    
            contenidoDiv.appendChild(deleteBtn);
        }
    
        // Agregar contenido al mensaje y a la vista
        mensajeDiv.appendChild(contenidoDiv);
        messagesContainer.appendChild(mensajeDiv);
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
>>>>>>> pruebas

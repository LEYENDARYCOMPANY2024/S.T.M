<<<<<<< HEAD
// Variable para controlar si las notificaciones están habilitadas
let notificationsEnabled = false;

// Función para alternar el estado del candado y cambiar el color del indicador
function toggleLock(button) {
    // Obtener el contenedor del nivel
    const levelContainer = button.closest('.level-container');
    
    // Obtener el número de nivel
    const levelNumber = parseInt(levelContainer.getAttribute('data-level') || 1);
    
    // Obtener el icono del candado
    const lockIcon = button.querySelector('.lock-icon');
    
    // Obtener el indicador de nivel (el círculo)
    const levelRow = button.closest('.level-row');
    const indicator = levelRow.querySelector('.level-indicator');
    
    // Verificar si es posible desbloquear este nivel
    if (lockIcon.textContent === '🔒') {
        // Si intentamos desbloquear un nivel superior al 1, verificar que el anterior esté desbloqueado
        if (levelNumber > 1) {
            const previousLevelContainer = document.querySelector(`.level-container[data-level="${levelNumber - 1}"]`);
            const previousLockIcon = previousLevelContainer.querySelector('.lock-icon');
            
            if (previousLockIcon.textContent === '🔒') {
                // El nivel anterior está bloqueado, no permitir desbloquear este nivel
                showMessage(`Debes desbloquear el nivel ${levelNumber - 1} primero`, 'warning');
                shakeElement(button);
                return;
            }
        }
        
        // Cambiar a desbloqueado con animación
        lockIcon.style.animation = 'unlock-animation 0.5s forwards';
        setTimeout(() => {
            lockIcon.textContent = '🔓';
            lockIcon.style.animation = '';
        }, 250);
        
        indicator.classList.remove('locked');
        indicator.classList.add('unlocked');
        
        // Animación para el contenedor de nivel
        levelContainer.style.animation = 'level-unlock 0.7s forwards';
        setTimeout(() => {
            levelContainer.style.animation = '';
        }, 700);
        
        // Crear partículas de desbloqueo
        createUnlockParticles(levelRow);
        
        // Notificar al usuario que ha desbloqueado el siguiente nivel si existe
        if (document.querySelector(`.level-container[data-level="${levelNumber + 1}"]`)) {
            showMessage(`¡Nivel ${levelNumber} desbloqueado! Ahora puedes acceder al nivel ${levelNumber + 1}`, 'success');
        } else {
            showMessage(`¡Nivel ${levelNumber} desbloqueado!`, 'success');
        }
    } else {
        // Verificar si hay niveles posteriores desbloqueados
        const nextLevelContainer = document.querySelector(`.level-container[data-level="${levelNumber + 1}"]`);
        if (nextLevelContainer) {
            const nextLockIcon = nextLevelContainer.querySelector('.lock-icon');
            if (nextLockIcon.textContent === '🔓') {
                // No permitir bloquear este nivel porque el siguiente está desbloqueado
                showMessage(`No puedes bloquear este nivel porque el nivel ${levelNumber + 1} está desbloqueado`, 'error');
                shakeElement(button);
                return;
            }
        }
        
        // Cambiar a bloqueado
        lockIcon.style.animation = 'unlock-animation 0.3s forwards';
        setTimeout(() => {
            lockIcon.textContent = '🔒';
            lockIcon.style.animation = '';
        }, 150);
        
        indicator.classList.remove('unlocked');
        indicator.classList.add('locked');
    }
}

// Función para mostrar/ocultar la descripción
function toggleDescription(button) {
    button.classList.toggle('open');
    const description = button.parentNode.nextElementSibling;
    
    if (!description.classList.contains('open')) {
        // Mostrar descripción con efecto de expansión
        description.classList.add('open');
    } else {
        // Ocultar descripción con efecto de contracción
        description.classList.remove('open');
    }
}

// Función para crear partículas cuando se desbloquea un nivel
function createUnlockParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Color aleatorio entre dorado y verde
        const hue = Math.random() * 60 + 120; // 120-180 (verde a dorado)
        particle.style.backgroundColor = `hsl(${hue}, 100%, 70%)`;
        
        // Tamaño aleatorio
        const size = Math.random() * 6 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Posición inicial
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        
        // Dirección y velocidad aleatorias
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100 + 50;
        const xSpeed = Math.cos(angle) * speed;
        const ySpeed = Math.sin(angle) * speed;
        
        // Animación personalizada
        particle.style.animation = 'none';
        document.body.appendChild(particle);
        
        // Mover partícula
        let startTime = null;
        const duration = Math.random() * 1000 + 500; // 0.5-1.5 segundos
        
        function animateParticle(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                const x = centerX + xSpeed * progress;
                const y = centerY + ySpeed * progress - (100 * Math.pow(progress, 2)); // Arco parabólico
                
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                particle.style.opacity = 1 - progress;
                
                requestAnimationFrame(animateParticle);
            } else {
                particle.remove();
            }
        }
        
        requestAnimationFrame(animateParticle);
    }
}

// Crear partículas flotantes para el fondo
function createBackgroundParticles() {
    const particlesContainer = document.getElementById('particles');
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Color aleatorio suave
        const hue = Math.random() * 60 + 180; // 180-240 (cyan a azul)
        particle.style.backgroundColor = `hsl(${hue}, 100%, 70%)`;
        
        // Tamaño aleatorio
        const size = Math.random() * 4 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Posición aleatoria
        const x = Math.random() * 100;
        particle.style.left = `${x}vw`;
        
        // Velocidad aleatoria
        const duration = Math.random() * 20 + 10;
        particle.style.animation = `float-up ${duration}s linear infinite`;
        particle.style.animationDelay = `-${Math.random() * duration}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Función para mostrar mensajes mejorada
function showMessage(text, type = 'success') {
    // Si las notificaciones están deshabilitadas, no mostrar nada
    if (!notificationsEnabled) return;
    
    // Crear o reutilizar el contenedor de mensajes
    let messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        messageContainer.style.position = 'fixed';
        messageContainer.style.bottom = '20px';
        messageContainer.style.left = '50%';
        messageContainer.style.transform = 'translateX(-50%)';
        messageContainer.style.zIndex = '1000';
        messageContainer.style.display = 'flex';
        messageContainer.style.flexDirection = 'column';
        messageContainer.style.alignItems = 'center';
        messageContainer.style.width = 'auto';
        messageContainer.style.maxWidth = '90%';
        document.body.appendChild(messageContainer);
    }
    
    // Crear el mensaje
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Estilos para el mensaje
    message.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    message.style.color = 'white';
    message.style.padding = '12px 24px';
    message.style.borderRadius = '8px';
    message.style.margin = '8px 0';
    message.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    message.style.fontFamily = "'Arial', sans-serif";
    message.style.fontSize = '16px';
    message.style.textAlign = 'center';
    message.style.minWidth = '200px';
    message.style.position = 'relative';
    message.style.overflow = 'hidden';
    
    // Definir color del borde según el tipo de mensaje
    let borderColor = '#4CAF50'; // Verde para éxito por defecto
    let icon = '✅ ';
    
    switch(type) {
        case 'success':
            borderColor = '#4CAF50'; // Verde
            icon = '✅ ';
            break;
        case 'warning':
            borderColor = '#FFC107'; // Amarillo
            icon = '⚠️ ';
            break;
        case 'error':
            borderColor = '#F44336'; // Rojo
            icon = '❌ ';
            break;
    }
    
    // Aplicar borde izquierdo de color
    message.style.borderLeft = `4px solid ${borderColor}`;
    
    // Añadir ícono según el tipo
    if (icon) {
        message.textContent = icon + ' ' + text;
    }
    
    // Efecto de brillo
    const shine = document.createElement('div');
    shine.style.position = 'absolute';
    shine.style.top = '0';
    shine.style.left = '0';
    shine.style.width = '100%';
    shine.style.height = '100%';
    shine.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 60%)';
    shine.style.pointerEvents = 'none';
    shine.style.borderRadius = '8px';
    message.appendChild(shine);
    
    // Agregar mensaje y animar entrada
    messageContainer.appendChild(message);
    
    // Animar entrada
    message.style.opacity = '0';
    message.style.transform = 'translateY(20px)';
    message.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    // Aplicar animación después de un pequeño delay para que funcione
    setTimeout(() => {
        message.style.opacity = '1';
        message.style.transform = 'translateY(0)';
    }, 10);
    
    // Animar salida y eliminar después de un tiempo
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transform = 'translateY(-10px)';
        
        // Eliminar el elemento después de completar la animación
        setTimeout(() => {
            if (message && message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 300);
    }, 3000);
}

// Función para efecto de sacudida en elementos
function shakeElement(element) {
    // Aplicar la animación de sacudida
    element.style.animation = 'shake 0.5s ease-in-out';
    
    // Restablecer la animación después de terminar
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todos los indicadores como bloqueados
    const indicators = document.querySelectorAll('.level-indicator');
    indicators.forEach(indicator => {
        indicator.classList.add('locked');
    });
    
    // Asegurarse de que todos los contenedores de nivel tengan su atributo data-level
    const levelContainers = document.querySelectorAll('.level-container');
    levelContainers.forEach((container, index) => {
        container.setAttribute('data-level', index + 1);
    });
    
    // Crear partículas de fondo
    createBackgroundParticles();
    
    // Añadir efecto 3D al mover el ratón
    document.addEventListener('mousemove', function(e) {
        const menu = document.getElementById('levels-menu');
        const rect = menu.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calcular desplazamiento desde el centro
        const moveX = (e.clientX - centerX) / 50;
        const moveY = (e.clientY - centerY) / 50;
        
        // Aplicar transformación 3D
        menu.style.transform = `perspective(1000px) rotateX(${-moveY}deg) rotateY(${moveX}deg)`;
    });
    
    // Restablecer transformación cuando el ratón sale
    document.addEventListener('mouseleave', function() {
        const menu = document.getElementById('levels-menu');
        menu.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
    
    // Añadir estilos CSS necesarios para las animaciones
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes unlock-animation {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        
        @keyframes level-unlock {
            0% { transform: scale(1); box-shadow: 0 0 0 rgba(76, 175, 80, 0); }
            50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(76, 175, 80, 0.5); }
            100% { transform: scale(1); box-shadow: 0 0 0 rgba(76, 175, 80, 0); }
        }
        
        @keyframes float-up {
            0% { transform: translateY(100vh); opacity: 0; }
            10% { opacity: 0.7; }
            90% { opacity: 0.7; }
            100% { transform: translateY(-50px); opacity: 0; }
        }
    `;
    document.head.appendChild(styleSheet);
    
    // Habilitar las notificaciones después de un tiempo o después de la primera interacción del usuario
    // Opción 1: Habilitar después de un tiempo específico (p.ej., 3 segundos)
    setTimeout(() => {
        notificationsEnabled = true;
    }, 3000);
    
    // Opción 2: Habilitar después de la primera interacción del usuario (descomen
    function enableNotifications() {
        notificationsEnabled = true;
        // Eliminar los event listeners una vez habilitadas las notificaciones
        document.removeEventListener('click', enableNotifications);
        document.removeEventListener('keydown', enableNotifications);
    }
    
    document.addEventListener('click', enableNotifications);
    document.addEventListener('keydown', enableNotifications);

});

// Función para habilitar manualmente las notificaciones
function enableNotifications() {
    notificationsEnabled = true;
}

// Función para deshabilitar manualmente las notificaciones
function disableNotifications() {
    notificationsEnabled = false;
}



// Ocultar todas las notificaciones al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
        message.style.display = 'none';
    });
});

// Función para mostrar una notificación específica
function showMessage(type, timeout = 3000) {
    // Ocultar todas las notificaciones primero
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
        message.style.display = 'none';
    });
    
    // Mostrar la notificación específica
    const message = document.querySelector(`.message.${type}`);
    if (message) {
        message.style.display = 'block';
        
        // Ocultar automáticamente después del tiempo especificado
        setTimeout(() => {
            message.style.display = 'none';
        }, timeout);
    }
}

// Función para alternar el bloqueo de niveles
function toggleLock(button) {
    const levelContainer = button.closest('.level-container');
    const levelIndicator = levelContainer.querySelector('.level-indicator');
    const lockIcon = button.querySelector('.lock-icon');
    const levelIndex = Array.from(document.querySelectorAll('.level-container')).indexOf(levelContainer);
    
    // Verificar si el nivel anterior está desbloqueado (excepto para el nivel 1)
    if (levelIndex > 0) {
        const previousLevelIndicator = document.querySelectorAll('.level-indicator')[levelIndex - 1];
        if (previousLevelIndicator.classList.contains('locked') && levelIndicator.classList.contains('locked')) {
            showMessage('warning');
            return;
        }
    }
    
    // Verificar si el nivel siguiente ya está desbloqueado
    if (levelIndex < document.querySelectorAll('.level-container').length - 1) {
        const nextLevelIndicator = document.querySelectorAll('.level-indicator')[levelIndex + 1];
        if (!nextLevelIndicator.classList.contains('locked') && !levelIndicator.classList.contains('locked')) {
            showMessage('warning');
            return;
        }
    }
    
    // Cambiar el estado del nivel
    if (levelIndicator.classList.contains('locked')) {
        levelIndicator.classList.remove('locked');
        levelIndicator.classList.add('unlocked');
        lockIcon.textContent = '🔓';
        showMessage('success');
    } else {
        levelIndicator.classList.remove('unlocked');
        levelIndicator.classList.add('locked');
        lockIcon.textContent = '🔒';
    }
}

// Función para mostrar/ocultar la descripción del nivel
function toggleDescription(button) {
    const levelContainer = button.closest('.level-container');
    const description = levelContainer.querySelector('.level-description');
    const arrowIcon = button.querySelector('svg');
    
    if (description.style.display === 'block') {
        description.style.display = 'none';
        arrowIcon.classList.remove('rotated');
    } else {
        description.style.display = 'block';
        arrowIcon.classList.add('rotated');
    }
}
=======

import { verificarSesionYRedirigir } from "./verificar_sesion.js";

document.addEventListener("DOMContentLoaded", function () {
        if (!verificarSesionYRedirigir()) return; // ⛔ Si no hay sesión, no continúa
        const pacienteId = localStorage.getItem("id_paciente");

        cargarNiveles(pacienteId);

    async function cargarNiveles(pacienteId) {
        try {
            const response = await fetch(`/api/pacientes/${pacienteId}/niveles`);
            if (!response.ok) {
                throw new Error(`Error en la API: ${response.status}`);
            }

            const niveles = await response.json();
            if (!Array.isArray(niveles)) {
                throw new Error("La API no devolvió una lista de niveles válida.");
            }

            // Ordenar niveles de forma ascendente por ID
            niveles.sort((a, b) => a.id_nivel - b.id_nivel);

            const menuContainer = document.getElementById("levels-menu");
            menuContainer.innerHTML = "";

            const nombresNiveles = [
                "Introducción al Movimiento",
                "Movilidad Básica",
                "Equilibrio Fundamental",
                "Coordinación Motora Inicial",
                "Fuerza y Estabilidad",
                "Resistencia Funcional",
                "Flexibilidad Avanzada",
                "Integración Neuromotora Completa"
            ];

            const estadosNiveles = new Map();

            niveles.forEach((nivel, index) => {
                nivel.nombre_nivel = `Nivel ${index + 1}: ${nombresNiveles[index]}`;

                if (index > 0) {
                    const estadoNivelAnterior = estadosNiveles.get(index) || "bloqueado";
                    
                    if (estadoNivelAnterior === "bloqueado") {
                        nivel.estado = "bloqueado";
                    }
                }

                estadosNiveles.set(index + 1, nivel.estado);
            });

            // Procesar niveles de forma secuencial
            for (const [index, nivel] of niveles.entries()) {
                const nivelContainer = document.createElement("div");
                nivelContainer.classList.add("level-container");
                nivelContainer.setAttribute("data-level", nivel.id_nivel);

                // Obtener ejercicios ordenados
                const ejercicios = await obtenerEjercicios(pacienteId, nivel.id_nivel);

                nivelContainer.innerHTML = `
                    <div class="level-row">
                        <div class="level-indicator ${nivel.estado === "desbloqueado" ? "unlocked" : "locked"}"></div>
                        <div class="level-name">${nivel.nombre_nivel}</div>
                        <button class="lock-button" onclick="toggleLock(this, ${pacienteId}, ${nivel.id_nivel}, ${index + 1})">
                            <i class="lock-icon">${nivel.estado === "desbloqueado" ? "🔓" : "🔒"}</i>
                        </button>
                        <button class="arrow-button" onclick="toggleDescription(this)">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="level-description">
                        <div class="text-content">
                            <p>${nivel.descripcion}</p>
                            <h4>Ejercicios:</h4>
                            <ul class="exercise-list">
                                ${ejercicios.map(ej => `
                                    <li>
                                        <strong>${ej.nom_ejercicio}</strong>
                                        <p>${ej.instrucciones}</p>
                                    </li>
                                `).join("")}
                            </ul>
                        </div>
                        <div class="video-container">
                            ${ejercicios.map(ej => {
                                const videoId = obtenerYouTubeID(ej.video_url);
                                return videoId ? `<iframe width="300" height="200" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`
                                            : `<p style="color:red;">No se puede mostrar el video</p>`;
                            }).join("")}
                        </div>
                    </div>
                `;

                menuContainer.appendChild(nivelContainer);
            }
        } catch (error) {
            console.error("Error al cargar niveles:", error);
        }
    }

    function obtenerYouTubeID(url) {
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/[^\/]+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }

    async function obtenerEjercicios(pacienteId, id_nivel) {
        try {
            const response = await fetch(`/api/pacientes/${pacienteId}/niveles/${id_nivel}/ejercicios`);
            if (!response.ok) {
                throw new Error(`Error en la API: ${response.status}`);
            }
            const ejercicios = await response.json();
            
            // Ordenar ejercicios por ID o por el orden que quieras
            return ejercicios.sort((a, b) => a.id_ejercicio - b.id_ejercicio);
        } catch (error) {
            console.error(`Error al obtener ejercicios del nivel ${id_nivel}:`, error);
            return [];
        }
    }

    async function toggleLock(button, pacienteId, id_nivel, nivelNumero) {
        const levelContainer = button.closest(".level-container");
        const lockIcon = button.querySelector(".lock-icon");
        const indicator = levelContainer.querySelector(".level-indicator");
        const levelName = levelContainer.querySelector(".level-name").textContent.trim();

        const niveles = Array.from(document.querySelectorAll(".level-container"));
        const currentIndex = niveles.findIndex(nivel => nivel === levelContainer);

        for (let i = 0; i < currentIndex; i++) {
            const previousLevelLockIcon = niveles[i].querySelector(".lock-icon");
            if (previousLevelLockIcon.textContent === "🔒") {
                showMessage(`Debes desbloquear primero los niveles anteriores`, "error");
                return;
            }
        }

        let nuevoEstado = lockIcon.textContent === "🔒" ? "desbloqueado" : "bloqueado";

        try {
            const response = await fetch(`/api/pacientes/${pacienteId}/niveles/${id_nivel}?estado=${nuevoEstado}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) throw new Error("No se pudo actualizar el nivel");

            if (nuevoEstado === "desbloqueado") {
                lockIcon.textContent = "🔓";
                indicator.classList.remove("locked");
                indicator.classList.add("unlocked");
                showMessage(`¡${levelName} desbloqueado!`, "success");
            } else {
                lockIcon.textContent = "🔒";
                indicator.classList.remove("unlocked");
                indicator.classList.add("locked");
                showMessage(`${levelName} bloqueado`, "error");
            }
        } catch (error) {
            console.error("Error al actualizar el estado del nivel:", error);
            showMessage("Error al cambiar el estado del nivel", "error");
        }
    }

    window.toggleLock = toggleLock;

    function toggleDescription(button) {
        button.classList.toggle("open");
        const description = button.parentNode.nextElementSibling;
        description.classList.toggle("open");
    }

    window.toggleDescription = toggleDescription;

    function showMessage(text, type = "success") {
        const messageContainer = document.getElementById("message-container");
        
        const message = document.createElement("div");
        message.className = `message ${type}`;
        message.textContent = text;

        messageContainer.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }


        const homeButton = document.querySelector(".home-button");
        if (!homeButton) return;
    
        homeButton.addEventListener("click", (e) => {
        e.preventDefault(); // ✅ evita redirección inmediata
    
        // 🧊 Modal estilo visual dark-glass
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
    
        const modal = document.createElement("div");
        modal.className = "modal-confirm";
    
        modal.innerHTML = `
            <h2>¿Ir al inicio?</h2>
            <p>⚠ Al volver al inicio, <strong>se cerrará esta sección</strong> y podrías perder el progreso actual.<br>
            ¿Deseas continuar?</p>
            <div class="modal-buttons">
            <button class="btn-secondary" id="cancelarVolver">Cancelar</button>
            <button class="btn-danger" id="confirmarVolver">Ir al inicio</button>
            </div>
        `;
    
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    
        // ❌ Cerrar modal
        document.getElementById("cancelarVolver").onclick = () => {
            overlay.remove();
        };
    
        // ✅ Confirmar salida
        document.getElementById("confirmarVolver").onclick = async () => {
            overlay.remove();
    
            const sesionId = localStorage.getItem("id_sesion");
            if (sesionId) {
            try {
                await fetch(`/dispositivos/desactivar/${sesionId}`, {
                method: "PUT"
                });
                console.log("🔌 Dispositivos desactivados correctamente.");
            } catch (error) {
                console.error("❌ Error al desactivar dispositivos:", error);
            }
            }
    
            localStorage.removeItem("id_sesion");
            localStorage.removeItem("nombre_sesion");
            localStorage.removeItem("sesion_dispositivo_ids");
    
            window.location.href = "/principal";
        };
        });
  });
  
>>>>>>> pruebas

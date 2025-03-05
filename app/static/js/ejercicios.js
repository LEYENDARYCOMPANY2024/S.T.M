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
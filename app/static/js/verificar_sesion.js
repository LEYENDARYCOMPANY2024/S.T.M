// verificar_sesion.js
export function verificarSesionYRedirigir() {
    const token = localStorage.getItem("session_token");

    if (!token) {
        mostrarYRedirigir("❌ Debes iniciar sesión para acceder a esta sección.");
        return false;
    }

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (!payload.exp || payload.exp < currentTime) {
            mostrarYRedirigir("⏳ Tu sesión ha expirado. Inicia sesión nuevamente.");
            return false;
        }

        return true; // ✅ Sesión válida

    } catch (e) {
        mostrarYRedirigir("❌ Token inválido o corrupto. Inicia sesión nuevamente.");
        return false;
    }

    function mostrarYRedirigir(mensaje) {
        // Crear contenedor si no existe
        let container = document.getElementById("message-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "message-container";
            document.body.appendChild(container);
        }
    
        // Crear el mensaje con el diseño de ejercicios
        const message = document.createElement("div");
        message.className = "message error";
        message.textContent = mensaje;
    
        container.appendChild(message);
    
        // Esperar 3s para redirigir y limpiar sesión
        setTimeout(() => {
            message.remove(); // Quita el mensaje
            localStorage.clear(); // Limpia token u otros datos
            window.location.href = "/";
        }, 3000);
    }
    
}

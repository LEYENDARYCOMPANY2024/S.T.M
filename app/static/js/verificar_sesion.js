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
        const alerta = document.createElement("div");
        alerta.className = "alert error show";
        alerta.innerHTML = mensaje;
        document.body.appendChild(alerta);

        setTimeout(() => {
            localStorage.clear();
            window.location.href = "/";
        }, 3000);
    }
}

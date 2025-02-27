document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        console.error("❌ Error: No se encontró el formulario de login. Verifica que tenga id='loginForm'.");
        return;
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = new FormData(this);

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(formData),
            });

            // 📌 Verificar si la respuesta es HTML en lugar de JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("❌ Error inesperado: El servidor devolvió HTML en lugar de JSON.");
            }

            if (!response.ok) {
                throw new Error("❌ Credenciales incorrectas o error del servidor.");
            }

            const data = await response.json();
            
            // 📌 Guardar token y datos en localStorage
            localStorage.setItem("session_token", data.token);
            localStorage.setItem("nombre_usuario", data.terapeuta.nombre_usuario);

            // 📌 Redirigir a la página principal
            window.location.href = "/principal";
        } catch (error) {
            alert(error.message);
        }
    });
});

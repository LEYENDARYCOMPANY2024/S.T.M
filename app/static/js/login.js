document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("session_token");

    if (token) {
        console.log("📌 Token detectado en localStorage:", token); // 🔹 Verificar el token guardado
        window.location.replace("/principal");
        return;
    }
    

    document.getElementById("loginForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = new FormData(this);
        const loginData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
            });

            if (!response.ok) {
                const errorResponse = await response.json();
                console.error("❌ Error en la respuesta del servidor:", JSON.stringify(errorResponse, null, 2));
                throw new Error("Usuario o contraseña incorrectos");
            }

            const data = await response.json();

            // 📌 Guardar el token y el usuario en `localStorage`
            localStorage.setItem("session_token", data.token);
            localStorage.setItem("nombre_usuario", data.terapeuta.nombre_usuario);

            console.log("📌 Token guardado correctamente:", data.token); // 🔹 Mostrar token guardado

            // 📌 Redirigir inmediatamente a la página principal
            window.location.replace("/principal");
        } catch (error) {
            alert(error.message);
        }
    });
});

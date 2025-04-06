<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("session_token");

    if (token) {
        console.log("📌 Token detectado en localStorage:", token); // 🔹 Verificar el token guardado
        window.location.replace("/principal");
        return;
    }
    

    document.getElementById("loginForm").addEventListener("submit", async function (event) {
=======
$(document).ready(function () {

    // 📌 Función para mostrar mensajes de éxito o error
    function showMessage(text, type = "success") {
        // 🔧 Crear el contenedor si no existe
        let container = document.getElementById("message-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "message-container";
            document.body.appendChild(container);
        }
    
        // 🧊 Crear el mensaje
        const message = document.createElement("div");
        message.className = `message ${type}`;
    
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
    // Verificar si jQuery se cargó correctamente
    if (typeof jQuery === "undefined") {
        console.error("jQuery no se ha cargado correctamente.");
        return;
    }
    console.log("jQuery cargado correctamente.");

    // Toggle de visibilidad de la contraseña
    $("#togglePassword").click(function () {
        const passwordField = $("#contrasena");
        if (passwordField.attr("type") === "password") {
            passwordField.attr("type", "text");
            $(this).removeClass("fa-eye").addClass("fa-eye-slash");
        } else {
            passwordField.attr("type", "password");
            $(this).removeClass("fa-eye-slash").addClass("fa-eye");
        }
    });

    // Verificar si hay un token en localStorage
    const token = localStorage.getItem("session_token");
    if (token) {
        console.log("📌 Token detectado en localStorage:", token);
        window.location.replace("/principal");
        return;
    }

    // Manejo del formulario de inicio de sesión
    $("#loginForm").submit(async function (event) {
>>>>>>> pruebas
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
<<<<<<< HEAD

            // 📌 Guardar el token y el usuario en `localStorage`
            localStorage.setItem("session_token", data.token);
            localStorage.setItem("nombre_usuario", data.terapeuta.nombre_usuario);

            console.log("📌 Token guardado correctamente:", data.token); // 🔹 Mostrar token guardado

            // 📌 Redirigir inmediatamente a la página principal
            window.location.replace("/principal");
        } catch (error) {
            alert(error.message);
=======
            localStorage.setItem("session_token", data.token);
            localStorage.setItem("nombre_usuario", data.terapeuta.nombre_usuario);

            console.log("📌 Token guardado correctamente:", data.token);
            window.location.replace("/principal");
        } catch (error) {
            showMessage(error.message, "error");
>>>>>>> pruebas
        }
    });
});

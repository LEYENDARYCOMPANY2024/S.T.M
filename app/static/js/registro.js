<<<<<<< HEAD
document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();  // Evitar envío tradicional del formulario

    const alert = document.getElementById('successAlert');
    const formData = new FormData(this); // Obtener los datos del formulario

    try {
        // Enviar los datos al backend con Fetch (AJAX)
        const response = await fetch("/registro", {
            method: "POST",
            body: formData,  // Enviar los datos como FormData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || "Error al registrar");
        }

        // Mostrar alerta de éxito
        alert.textContent = result.message;  // Mostrar mensaje del backend
        alert.classList.add('show');  // Hacer visible la alerta

        // Esperamos 3 segundos, mostramos la alerta y redirigimos
        setTimeout(() => {
            alert.classList.remove('show');  // Ocultar la alerta
            window.location.href = "/login";  // Redirigir al login
        }, 3000);  // 3 segundos antes de redirigir

        // Limpiar el formulario
        this.reset();

    } catch (error) {
        console.error("Error al registrar:", error.message);
        alert.textContent = "❌ Error al registrar: " + error.message;  // Mostrar error en la alerta
        alert.classList.add('show');
        
        // Ocultar alerta después de 3 segundos
        setTimeout(() => {
            alert.classList.remove('show');
        }, 1000);
    }
=======
document.addEventListener('DOMContentLoaded', function () {
    // Elementos principales
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById("contrasena");
    const strengthIndicator = document.getElementById("strengthIndicator");
    const strengthText = document.getElementById("strengthText");
    const registerForm = document.getElementById("registerForm");
    const registerButton = document.getElementById("registerButton");
    registerButton.disabled = true;
    const termsCheckbox = document.getElementById("termsCheckbox");
    const termsError = document.getElementById("termsError");
    const modal = document.getElementById("termsModal");
    const closeButton = document.querySelector(".close-button");
    const toggleTermsLink = document.getElementById("toggleTerms");

    // Reiniciar barra de seguridad al cargar
    strengthIndicator.style.width = "0%";
    strengthText.innerText = "Seguridad: Ninguna";

    // ✅ Mensajes unificados
    function showMessage(text, type = "success") {
        let container = document.getElementById("message-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "message-container";
            document.body.appendChild(container);
        }

        const message = document.createElement("div");
        message.className = `message ${type}`;
        const icon = {
            success: "",
            error: "",
            warning: ""
        }[type] || "";

        message.innerHTML = `<span class="message-icon">${icon}</span> ${text}`;
        container.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }

    // Mostrar/ocultar contraseña
    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Verificar fortaleza de contraseña
    passwordInput.addEventListener("input", function () {
        const password = passwordInput.value;
        const strength = checkPasswordStrength(password);
        strengthIndicator.style.width = strength.percentage;
        strengthIndicator.style.backgroundColor = strength.color;
        strengthText.innerText = "Seguridad: " + strength.text;
    });

    function checkPasswordStrength(password) {
        if (password.length === 0) return { text: "Ninguna", color: "transparent", percentage: "0%" };
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (password.match(/[A-Z]/)) strength += 1;
        if (password.match(/[0-9]/)) strength += 1;
        if (password.match(/[@$!%*?&]/)) strength += 1;

        const levels = [
            { text: "Muy débil", color: "red", percentage: "25%" },
            { text: "Débil", color: "orange", percentage: "50%" },
            { text: "Aceptable", color: "yellow", percentage: "75%" },
            { text: "Segura", color: "green", percentage: "100%" }
        ];

        return levels[strength] || levels[0];
    }

    // Mostrar modal desde el link
    toggleTermsLink.addEventListener('click', function (e) {
        e.preventDefault();
        modal.style.display = 'block';
    });

    // Cerrar modal
    closeButton.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', e => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Habilitar botón si acepta términos
    termsCheckbox.addEventListener('change', function () {
        registerButton.disabled = !this.checked;
        if (this.checked) termsError.style.display = "none";
    });

    // Envío del formulario
    registerForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(this);

        if (!termsCheckbox.checked) {
            showMessage("Debes aceptar los términos y condiciones.", "warning");
            return;
        }

        try {
            const response = await fetch("/registro", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || "Error al registrar. Intenta nuevamente.");
            }

            showMessage(result.message, "success");

            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);

            this.reset();
            strengthIndicator.style.width = "0%";
            strengthText.innerText = "Seguridad: Ninguna";
            registerButton.disabled = true;

        } catch (error) {
            let message = "Ocurrió un error al registrar.";

            if (error instanceof Error) {
                const msg = error.message.toLowerCase();
                if (msg.includes("networkerror") || msg.includes("failed to fetch")) {
                    message = "No se pudo conectar con el servidor. Revisa tu conexión.";
                } else if (msg.includes("correo ya registrado")) {
                    message = "Este correo ya está registrado.";
                } else {
                    message = error.message;
                }
            }

            showMessage(message, "error");
        }
    });
>>>>>>> pruebas
});

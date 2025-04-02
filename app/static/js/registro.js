document.addEventListener('DOMContentLoaded', function () {
    // Elementos principales
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById("contrasena");
    const strengthIndicator = document.getElementById("strengthIndicator");
    const strengthText = document.getElementById("strengthText");
    const registerForm = document.getElementById("registerForm");
    const registerButton = document.getElementById("registerButton");
    registerButton.disabled = true; // Asegura que esté deshabilitado al inicio
    const termsCheckbox = document.getElementById("termsCheckbox");
    const termsError = document.getElementById("termsError");
    const modal = document.getElementById("termsModal");
    const closeButton = document.querySelector(".close-button");
    const toggleTermsLink = document.getElementById("toggleTerms");

    // Reiniciar barra de seguridad al cargar
    strengthIndicator.style.width = "0%";
    strengthText.innerText = "Seguridad: Ninguna";

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
        if (password.length === 0) {
            return { text: "Ninguna", color: "transparent", percentage: "0%" };
        }
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

    // Cerrar modal con botón X
    closeButton.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    // Cerrar modal si se hace clic fuera del contenido
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Habilitar botón de registro al marcar el checkbox
    termsCheckbox.addEventListener('change', function () {
        registerButton.disabled = !this.checked;
        if (this.checked) {
            termsError.style.display = "none";
        }
    });

    // Validación extra antes de enviar
    registerForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const alert = document.getElementById('successAlert');
        const formData = new FormData(this);

        if (!termsCheckbox.checked) {
            termsError.style.display = "block";
            setTimeout(() => {
                termsError.style.display = "none";
            }, 3000);
            return;
        }

        try {
            const response = await fetch("/registro", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || "Error al registrar");
            }

            alert.textContent = result.message;
            alert.classList.add('show');

            setTimeout(() => {
                alert.classList.remove('show');
                window.location.href = "/login";
            }, 3000);

            this.reset();

            // Reiniciar barra de seguridad
            strengthIndicator.style.width = "0%";
            strengthText.innerText = "Seguridad: Ninguna";
            registerButton.disabled = true;

        } catch (error) {
            alert.textContent = "❌ Error al registrar: " + error.message;
            alert.classList.add('show');
            setTimeout(() => {
                alert.classList.remove('show');
            }, 3000);
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Toggle de visibilidad de la contraseña
    const togglePassword = document.getElementById('togglePassword');
    
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordField = document.getElementById('contrasena');
            
            // Cambiar tipo de input
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                // Cambiar icono a ojo tachado
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                passwordField.type = 'password';
                // Cambiar icono a ojo normal
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    }
    
    // El resto de tu código para el formulario
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
    });
});

$(document).ready(function () {
    // Mostrar/ocultar términos y condiciones
    $('#toggleTerms').on('click', function () {
        $('#termsBox').slideToggle();
        $(this).text($(this).text() === 'Ver Términos y Condiciones' ? 'Ocultar Términos y Condiciones' : 'Ver Términos y Condiciones');
    });

    // Habilitar/deshabilitar botón de registro al aceptar los términos
    $('#termsCheckbox').on('change', function () {
        $('#registerButton').prop('disabled', !this.checked);
    });

    // Mostrar/ocultar contraseña
    $('#togglePassword').on('click', function () {
        let passwordField = $('#contrasena');
        let type = passwordField.attr('type') === 'password' ? 'text' : 'password';
        passwordField.attr('type', type);
        $(this).toggleClass('fa-eye fa-eye-slash');
    });
});

   // Modal de términos y condiciones
   const modal = $('#termsModal');
   const btn = $('#toggleTerms');
   const span = $('.close-button');
   const acceptBtn = $('#acceptTermsBtn');

   // Abrir modal al hacer clic en el botón
   btn.click(function() {
       modal.css('display', 'block');
   });

   // Cerrar modal al hacer clic en X
   span.click(function() {
       modal.css('display', 'none');
   });

   // Cerrar modal al hacer clic fuera del contenido
   $(window).click(function(event) {
       if (event.target === modal[0]) {
           modal.css('display', 'none');
       }
   });

   // Aceptar términos desde el modal
   acceptBtn.click(function() {
       $('#termsCheckbox').prop('checked', true);
       updateRegisterButton();
       modal.css('display', 'none');
   });

   document.addEventListener("DOMContentLoaded", function() {
    const passwordInput = document.getElementById("contrasena");
    const strengthIndicator = document.getElementById("strengthIndicator");
    const strengthText = document.getElementById("strengthText");

    passwordInput.addEventListener("input", function() {
        const password = passwordInput.value;
        const strength = checkPasswordStrength(password);

        strengthIndicator.style.width = strength.percentage;
        strengthIndicator.style.backgroundColor = strength.color;
        strengthText.innerText = "Seguridad: " + strength.text;
    });

    function checkPasswordStrength(password) {
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
});

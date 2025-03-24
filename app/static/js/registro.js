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
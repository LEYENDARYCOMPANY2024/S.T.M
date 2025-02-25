document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Evitar envío tradicional del formulario
    
    // Mostrar alerta de éxito
    const alert = document.getElementById('successAlert');
    alert.classList.add('show');  // Añadir la clase para mostrar la alerta
    
    // Esperar 3 segundos, luego ocultar la alerta y redirigir
    setTimeout(function() {
        alert.classList.remove('show');  // Remover la clase para ocultar la alerta
        window.location.href = "/login";  // Redirigir a la página de login
    }, 1000);
    
    // Opcional: limpiar el formulario
    this.reset();
});

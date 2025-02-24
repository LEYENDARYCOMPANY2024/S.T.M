document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Mostrar alerta de éxito
    const alert = document.getElementById('successAlert');
    alert.classList.add('show');
    
    // Ocultar la alerta después de 3 segundos
    setTimeout(function() {
        alert.classList.remove('show');
    }, 3000);
    
    // Opcional: limpiar el formulario
    this.reset();
});
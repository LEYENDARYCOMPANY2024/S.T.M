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

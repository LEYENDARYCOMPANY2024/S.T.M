document.addEventListener("DOMContentLoaded", function () {
    const editBtn = document.getElementById("edit-btn");
    const saveBtn = document.getElementById("save-btn");
    const inputs = document.querySelectorAll("input:not([type='file'])");
    const successAlert = document.getElementById("successAlert");

    editBtn.addEventListener("click", function () {
        inputs.forEach(input => input.removeAttribute("disabled"));
        saveBtn.removeAttribute("disabled");
    });

    saveBtn.addEventListener("click", function () {
        inputs.forEach(input => input.setAttribute("disabled", "true"));
        saveBtn.setAttribute("disabled", "true");

        // Mostrar la alerta de éxito
        successAlert.classList.add("show");

        // Ocultar la alerta después de 3 segundos
        setTimeout(() => {
            successAlert.classList.remove("show");
        }, 3000);
    });
});
// Script para manejar la subida de la foto de perfil
document.querySelector('.upload-photo-btn').addEventListener('click', function() {
    document.getElementById('photo-upload').click();
});

document.getElementById('photo-upload').addEventListener('change', function(event) {
    if (event.target.files && event.target.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            document.getElementById('profile-photo').src = e.target.result;
        };
        
        reader.readAsDataURL(event.target.files[0]);
    }
});
        // Script para manejar la subida de la foto de perfil
        document.querySelector('.upload-photo-btn').addEventListener('click', function() {
            document.getElementById('photo-upload').click();
        });

        document.getElementById('photo-upload').addEventListener('change', function(event) {
            if (event.target.files && event.target.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    document.getElementById('profile-photo').src = e.target.result;
                };
                
                reader.readAsDataURL(event.target.files[0]);
            }
        });

        // Script para manejar la subida de la cédula profesional
        document.getElementById('cedula-upload').addEventListener('change', function(event) {
            if (event.target.files && event.target.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    document.getElementById('cedula-image').src = e.target.result;
                    document.getElementById('cedula-preview').style.display = 'block';
                };
                
                reader.readAsDataURL(event.target.files[0]);
            }
        });

        // Función para habilitar el modo de edición
        const editBtn = document.getElementById('edit-btn');
        const saveBtn = document.getElementById('save-btn');
        
        // Obtener todos los inputs del formulario
        const allInputs = document.querySelectorAll('input[type="text"], input[type="email"]');
        const uploadButtons = document.querySelectorAll('.add-button, .upload-photo-btn');
        
        // Función para alternar el modo de edición
        editBtn.addEventListener('click', function() {
            // Cambiar el estado de los inputs
            allInputs.forEach(input => {
                input.disabled = !input.disabled;
            });
            
            // Cambiar el estado de los botones de subida
            uploadButtons.forEach(button => {
                button.disabled = !button.disabled;
            });
            
            // Cambiar el estado del botón de guardar
            saveBtn.disabled = !saveBtn.disabled;
            
            // Cambiar el texto del botón
            if (!saveBtn.disabled) {
                editBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Cancelar
                `;
            } else {
                editBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar
                `;
            }
        });
            // Restaurar el botón de editar
            editBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Editar
            `;
//alerta de guardado
        document.addEventListener("DOMContentLoaded", function () {
            const editBtn = document.getElementById("edit-btn");
            const saveBtn = document.getElementById("save-btn");
            const inputs = document.querySelectorAll("input:not([type='file'])");
            const successAlert = document.getElementById("successAlert");
        
            editBtn.addEventListener("click", function () {
                inputs.forEach(input => input.removeAttribute("disabled"));
                saveBtn.removeAttribute("disabled");
            });
        
            saveBtn.addEventListener("click", function () {
                inputs.forEach(input => input.setAttribute("disabled", "true"));
                saveBtn.setAttribute("disabled", "true");
        
                // Mostrar la alerta de éxito
                successAlert.classList.add("show");
        
                // Ocultar la alerta después de 3 segundos
                setTimeout(() => {
                    successAlert.classList.remove("show");
                }, 3000);
            });
        });

        //subir foto a perfil por medio de un boton de subir foto
        function previewImage(event) {
            const reader = new FileReader();
            reader.onload = function(){
                const img = document.getElementById('profile-photo');
                img.src = reader.result;
            }
            reader.readAsDataURL(event.target.files[0]);
        }
        function previewImage(event) {
            const reader = new FileReader();
            reader.onload = function(){
                document.getElementById('profile-photo').src = reader.result;
            }
            reader.readAsDataURL(event.target.files[0]);
        }

        function cerrarSesion() {
            alert("Sesión cerrada correctamente");
            window.location.href = "index.html";
        }
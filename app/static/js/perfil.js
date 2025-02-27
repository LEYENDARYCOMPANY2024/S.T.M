document.addEventListener("DOMContentLoaded", function () {
    const editBtn = document.getElementById("edit-btn");
    const saveBtn = document.getElementById("save-btn");
    const inputs = document.querySelectorAll("input:not([type='file'])");
    const uploadButtons = document.querySelectorAll(".add-button, .upload-photo-btn");
    const successAlert = document.getElementById("successAlert");
    const profilePhoto = document.getElementById("profile-photo");
    const photoUpload = document.getElementById("photo-upload");
    const cedulaUpload = document.getElementById("cedula-upload");
    const cedulaImage = document.getElementById("cedula-image");
    const cedulaPreview = document.getElementById("cedula-preview");

    // ✅ Habilitar edición del perfil
    editBtn.addEventListener("click", function () {
        const isEditing = !saveBtn.disabled;

        inputs.forEach(input => input.disabled = isEditing);
        uploadButtons.forEach(button => button.disabled = isEditing);
        saveBtn.disabled = isEditing;

        editBtn.innerHTML = isEditing
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Editar`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Cancelar`;
    });

    // ✅ Guardar cambios y deshabilitar edición
    saveBtn.addEventListener("click", function () {
        inputs.forEach(input => input.disabled = true);
        uploadButtons.forEach(button => button.disabled = true);
        saveBtn.disabled = true;

        // ✅ Mostrar alerta de éxito
        successAlert.classList.add("show");
        setTimeout(() => successAlert.classList.remove("show"), 3000);

        // Restaurar botón de edición
        editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Editar`;
    });

    // ✅ Subir foto de perfil
    document.querySelector(".upload-photo-btn").addEventListener("click", () => photoUpload.click());

    photoUpload.addEventListener("change", function (event) {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = e => profilePhoto.src = e.target.result;
            reader.readAsDataURL(event.target.files[0]);
        }
    });

    // ✅ Subir cédula profesional
    cedulaUpload.addEventListener("change", function (event) {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = e => {
                cedulaImage.src = e.target.result;
                cedulaPreview.style.display = "block";
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    });

    // ✅ Función para cerrar sesión
    window.cerrarSesion = function () {
        // 📌 Eliminar el token de la sesión
        localStorage.removeItem("session_token");

        // 📌 Redirigir al usuario al index (o a la página de login)
        window.location.href = "/index.html";
    };

});

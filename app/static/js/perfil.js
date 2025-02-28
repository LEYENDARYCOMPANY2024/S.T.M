document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("session_token");

    // 📌 Si no hay token, redirigir al login
    if (!token) {
        window.location.href = "/";
        return;
    }

    // 📌 Decodificar el token para obtener el id_terapeuta
    function parseJwt(token) {
        try {
            return JSON.parse(atob(token.split(".")[1]));
        } catch (e) {
            return null;
        }
    }

    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.sub) {
        localStorage.removeItem("session_token"); // Eliminar token corrupto
        window.location.href = "/";
        return;
    }

    const idTerapeuta = decodedToken.sub; // ID del terapeuta desde el token

    // 📌 Obtener datos del perfil desde la API
    try {
        const response = await fetch(`/perfil/${idTerapeuta}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener los datos del perfil");
        }

        const data = await response.json();

        // 📌 Llenar los campos con los datos obtenidos
        document.querySelector("input[placeholder='Nombre']").value = data.nombre;
        document.querySelector("input[placeholder='Primer apellido']").value = data.primer_apellido;
        document.querySelector("input[placeholder='Segundo apellido']").value = data.segundo_apellido || "";
        document.querySelector("input[placeholder='Correo electrónico']").value = data.correo;
        document.querySelector("input[placeholder='Código Postal']").value = data.codigo_postal || "";
        document.querySelector("input[placeholder='Calle']").value = data.calle || "";
        document.querySelector("input[placeholder='Colonia']").value = data.colonia || "";
        document.querySelector("input[placeholder='Número exterior']").value = data.num_ext || "";
        document.querySelector("input[placeholder='Número interior']").value = data.num_int || "";
    } catch (error) {
        console.error("❌ Error al cargar perfil:", error);
    }

    // 📌 Habilitar edición del perfil
    const editBtn = document.getElementById("edit-btn");
    const saveBtn = document.getElementById("save-btn");
    const inputs = document.querySelectorAll("input:not([type='file'])");
    const uploadButtons = document.querySelectorAll(".add-button, .upload-photo-btn");

    editBtn.addEventListener("click", function () {
        const isEditing = !saveBtn.disabled;
        inputs.forEach(input => input.disabled = isEditing);
        uploadButtons.forEach(button => button.disabled = isEditing);
        saveBtn.disabled = isEditing;

        editBtn.innerHTML = isEditing
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Cancelar`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Editar`;
    });

    // 📌 Guardar cambios
    saveBtn.addEventListener("click", async function () {
        const updatedData = {
            nombre: document.querySelector("input[placeholder='Nombre']").value,
            primer_apellido: document.querySelector("input[placeholder='Primer apellido']").value,
            segundo_apellido: document.querySelector("input[placeholder='Segundo apellido']").value,
            correo: document.querySelector("input[placeholder='Correo electrónico']").value,
            codigo_postal: document.querySelector("input[placeholder='Código Postal']").value,
            calle: document.querySelector("input[placeholder='Calle']").value,
            colonia: document.querySelector("input[placeholder='Colonia']").value,
            num_ext: document.querySelector("input[placeholder='Número exterior']").value,
            num_int: document.querySelector("input[placeholder='Número interior']").value
        };

        try {
            const response = await fetch(`/perfil/${idTerapeuta}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error("Error al actualizar el perfil");
            }

            alert("✅ Perfil actualizado correctamente");
        } catch (error) {
            console.error("❌ Error al actualizar perfil:", error);
        }

        // Deshabilitar edición después de guardar
        inputs.forEach(input => input.disabled = true);
        uploadButtons.forEach(button => button.disabled = true);
        saveBtn.disabled = true;
    });

    // 📌 Subir foto de perfil
    document.getElementById("photo-upload").addEventListener("change", function (event) {
        const reader = new FileReader();
        reader.onload = function () {
            document.getElementById("profile-photo").src = reader.result;
        };
        reader.readAsDataURL(event.target.files[0]);
    });

    // 📌 Subir cédula profesional
    document.getElementById("cedula-upload").addEventListener("change", function (event) {
        const reader = new FileReader();
        reader.onload = function () {
            document.getElementById("cedula-image").src = reader.result;
            document.getElementById("cedula-preview").style.display = "block";
        };
        reader.readAsDataURL(event.target.files[0]);
    });

    // 📌 Cerrar sesión
    window.cerrarSesion = function () {
        localStorage.removeItem("session_token");
        window.location.href = "/";
    };
});

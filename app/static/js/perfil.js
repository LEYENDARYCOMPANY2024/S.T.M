document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("session_token");

    // 📌 Función para limpiar los valores antes de enviarlos
    function sanitizeValue(value) {
        return value.trim() === "" ? null : value; // Si el valor es vacío, devolver `null`
    }

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

        // 📌 Guardar `nombre_usuario` en localStorage para enviarlo en `PUT`
        localStorage.setItem("nombre_usuario", data.nombre_usuario);

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
            ? `Cancelar`
            : `Editar`;
    });

    // 📌 Guardar cambios
    saveBtn.addEventListener("click", async function () {

        const updatedData = {};

        // 📌 Definir los campos a actualizar
        const fields = [
            { selector: "input[placeholder='Nombre']", key: "nombre" },
            { selector: "input[placeholder='Primer apellido']", key: "primer_apellido" },
            { selector: "input[placeholder='Segundo apellido']", key: "segundo_apellido" },
            { selector: "input[placeholder='Correo electrónico']", key: "correo" },
            { selector: "input[placeholder='Código Postal']", key: "codigo_postal" },
            { selector: "input[placeholder='Calle']", key: "calle" },
            { selector: "input[placeholder='Colonia']", key: "colonia" },
            { selector: "input[placeholder='Número exterior']", key: "num_ext" },
            { selector: "input[placeholder='Número interior']", key: "num_int" }
        ];

        fields.forEach(field => {
            const element = document.querySelector(field.selector);
            if (element) {
                const value = element.value.trim();
                if (value !== "") {  
                    updatedData[field.key] = value;
                }
            }
        });

        // 📌 Agregar `nombre_usuario` porque FastAPI lo requiere
        updatedData["nombre_usuario"] = localStorage.getItem("nombre_usuario");

        console.log("📌 Datos enviados al servidor:", JSON.stringify(updatedData, null, 2));

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
                const errorResponse = await response.json();
                console.error("❌ Error en la respuesta del servidor:", JSON.stringify(errorResponse, null, 2));
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
        localStorage.removeItem("nombre_usuario");
        window.location.href = "/";
    };
});

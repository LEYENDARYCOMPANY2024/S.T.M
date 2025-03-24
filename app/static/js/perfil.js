document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("session_token");

    // Control del botón de regreso
    const backButton = document.querySelector(".back-button");
    
    if (backButton) {
        backButton.addEventListener("click", function () {
            window.history.back();
        });
    } else {
        console.error("⚠️ No se encontró el botón de regresar.");
    }

    function showSessionExpiredMessage() {
        const sessionAlert = document.getElementById("session-alert");
        
        if (!sessionAlert) {
            console.error("⚠️ No se encontró el elemento #session-alert");
            return;
        }
    
        sessionAlert.classList.remove("hidden");
        sessionAlert.classList.add("show");  
    
        console.warn("⚠️ Mostrando alerta de sesión expirada");
    
        setTimeout(() => {
            localStorage.removeItem("session_token");
            window.location.href = "/";
        }, 3000);
    }
    
    // Verificación de token y autenticación (código mantenido igual)
    if (!token) {
        console.warn("⚠️ No hay token en localStorage, mostrando mensaje...");
        showSessionExpiredMessage();
        return;
    }

    console.log("📌 Token detectado en `perfil.js` antes de enviar:", token);

    function parseJwt(token) {
        try {
            return JSON.parse(atob(token.split(".")[1]));
        } catch (e) {
            console.error("❌ Error al decodificar el token:", e);
            return null;
        }
    }

    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.sub || !decodedToken.exp) {
        console.warn("⚠️ Token inválido o corrupto, eliminando...");
        showSessionExpiredMessage();
        return;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (decodedToken.exp < currentTime) {
        console.warn("⏳ Token expirado, mostrando mensaje...");
        showSessionExpiredMessage();
        return;
    }

    const idTerapeuta = decodedToken.sub;
    console.log(`📌 Usuario autenticado en perfil. ID: ${idTerapeuta}, Token: ${token}`);

    localStorage.setItem("id_terapeuta", idTerapeuta);
    console.log(`📌 Usuario autenticado en perfil. ID Terapeuta guardado: ${idTerapeuta}`);

    // Obtener datos del perfil (código mantenido igual)
    try {
        const response = await fetch(`/perfil/${idTerapeuta}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        console.log(`📌 Enviando token a backend: ${token}`);

        if (!response.ok) {
            console.error(`❌ Error en la solicitud: ${response.status}`);
            if (response.status === 401) {
                console.error("❌ Token inválido o expirado. Redirigiendo al login...");
                localStorage.removeItem("session_token");
                return;
            }
            throw new Error("Error al obtener los datos del perfil");
        }

        const data = await response.json();
        console.log("📌 Datos del perfil obtenidos correctamente:", data);

        localStorage.setItem("nombre_usuario", data.nombre_usuario);

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

    // ===== CÓDIGO MODIFICADO PARA CONTROL DE EDICIÓN =====
    const editBtn = document.getElementById("edit-btn");
    const saveBtn = document.getElementById("save-btn");
    
    // Seleccionar todos los campos de entrada relevantes
    const inputs = document.querySelectorAll("input:not([type='file'])");
    const fileInputs = document.querySelectorAll("input[type='file']");
    const uploadButtons = document.querySelectorAll(".add-button, .upload-photo-btn");
    const deleteButtons = document.querySelectorAll(".delete-cedula-btn");
    
    // Deshabilitar todos los campos al iniciar
    inputs.forEach(input => input.disabled = true);
    fileInputs.forEach(input => input.disabled = true);
    uploadButtons.forEach(button => button.disabled = true);
    deleteButtons.forEach(button => button.style.display = 'none');
    saveBtn.disabled = true;

    // Función para manejar el estado de edición
    function toggleEditMode(isEditing) {
        // Habilitar/deshabilitar campos de texto
        inputs.forEach(input => input.disabled = !isEditing);
        
        // Habilitar/deshabilitar carga de archivos
        fileInputs.forEach(input => input.disabled = !isEditing);
        
        // Habilitar/deshabilitar botones de carga
        uploadButtons.forEach(button => button.disabled = !isEditing);
        
        // Mostrar/ocultar botones de eliminación
        deleteButtons.forEach(button => {
            button.style.display = isEditing ? 'block' : 'none';
        });
        
        // Habilitar/deshabilitar botón de guardar
        saveBtn.disabled = !isEditing;
        
        // Cambiar texto del botón de editar
        editBtn.innerHTML = isEditing ? `Cancelar` : `Editar`;
    }

    // Evento para el botón de editar/cancelar
    editBtn.addEventListener("click", function () {
        const isCurrentlyEditing = saveBtn.disabled === false;
        toggleEditMode(!isCurrentlyEditing);
    });

    // ===== CÓDIGO PARA MANEJO DE CÉDULA PROFESIONAL =====
    const cedulaUpload = document.getElementById('cedula-upload');
    const cedulaPreview = document.getElementById('cedula-preview');
    const cedulaImage = document.getElementById('cedula-image');
    
    // Asegurarse que la cédula inicie como no editable
    cedulaUpload.disabled = true;
    
    // Crear botón para eliminar la cédula si no existe
    let deleteButton = cedulaPreview.querySelector('.delete-cedula-btn');
    if (!deleteButton) {
        deleteButton = document.createElement('button');
        deleteButton.className = 'delete-cedula-btn';
        deleteButton.innerHTML = '❌';
        deleteButton.title = 'Eliminar archivo';
        deleteButton.style.position = 'absolute';
        deleteButton.style.top = '5px';
        deleteButton.style.right = '5px';
        deleteButton.style.background = 'transparent';
        deleteButton.style.border = 'none';
        deleteButton.style.cursor = 'pointer';
        deleteButton.style.fontSize = '16px';
        deleteButton.style.display = 'none';
        
        cedulaPreview.style.position = 'relative';
        cedulaPreview.appendChild(deleteButton);
    }
    
    // Mostrar el botón de eliminar cuando hay una imagen o PDF cargado
    cedulaUpload.addEventListener('change', function() {
        if (cedulaUpload.files.length > 0) {
            deleteButton.style.display = 'block';
        }
    });
    
    // Función para eliminar la cédula subida
    deleteButton.addEventListener('click', function(e) {
        e.preventDefault();
        cedulaImage.src = '';
        cedulaImage.style.display = 'none';
        cedulaUpload.value = '';
        deleteButton.style.display = 'none';
        
        // Eliminar mensaje de nombre de archivo si existe
        const fileNameElement = cedulaPreview.querySelector('.file-name');
        if (fileNameElement) {
            cedulaPreview.removeChild(fileNameElement);
        }
    });

    // ===== CÓDIGO PARA MANEJO DE IMAGEN DE PERFIL =====
    const fileInput = document.getElementById('file-input');
    const profilePhoto = document.getElementById('profile-photo');
    
    // Deshabilitar la carga de imagen al iniciar
    fileInput.disabled = true;
    
    // Cargar imagen guardada en localStorage (si existe)
    const savedImage = localStorage.getItem("profile-image");
    if (savedImage) {
        profilePhoto.src = savedImage;
    }

    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profilePhoto.src = e.target.result;
                localStorage.setItem("profile-image", e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // ===== CÓDIGO PARA GUARDAR CAMBIOS =====
    saveBtn.addEventListener("click", async function () {
        const updatedData = {};

        // Definir los campos a actualizar
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

        // Agregar nombre_usuario porque FastAPI lo requiere
        updatedData["nombre_usuario"] = localStorage.getItem("nombre_usuario");

        // Agregar información de la cédula profesional si existe
        if (cedulaImage.src) {
            // Aquí puedes agregar código para enviar la cédula al servidor
            console.log('Cédula guardada:', cedulaImage.src.substring(0, 30) + '...');
        }

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

            const successAlert = document.getElementById("successAlert");
            successAlert.classList.add("show");

            setTimeout(() => {
                successAlert.classList.remove("show");
            }, 3000);

        } catch (error) {
            console.error("❌ Error al actualizar perfil:", error);
        }

        // Volver al modo de solo lectura después de guardar
        toggleEditMode(false);
    });

    // ===== CERRAR SESIÓN =====
    window.cerrarSesion = function () {
        console.warn("⚠️ Cerrando sesión...");
        localStorage.removeItem("session_token");
        localStorage.removeItem("nombre_usuario");
        window.location.replace("/");
    };
});
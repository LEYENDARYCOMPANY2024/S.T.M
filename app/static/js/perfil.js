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

    // Función para establecer de manera segura los valores en los campos
    function safelySetValue(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.value = value || "";
        } else {
            console.warn(`⚠️ Elemento no encontrado: ${selector}`);
        }
    }

    // Obtener datos del perfil
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

        // Establecer valores de manera segura
        safelySetValue("input[placeholder='Nombre']", data.nombre);
        safelySetValue("input[placeholder='Primer apellido']", data.primer_apellido);
        safelySetValue("input[placeholder='Segundo apellido']", data.segundo_apellido);
        safelySetValue("input[placeholder='Correo electrónico']", data.correo);
        safelySetValue("input[placeholder='Código Postal']", data.codigo_postal);
        safelySetValue("input[placeholder='Calle']", data.calle);
        safelySetValue("input[placeholder='Colonia']", data.colonia);
        safelySetValue("input[placeholder='Número exterior']", data.num_ext);
        safelySetValue("input[placeholder='Número interior']", data.num_int);
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
    
    if (cedulaUpload && cedulaPreview && cedulaImage) {
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

        // Mostrar vista previa de PDF o imagen si existe en backend
        const cedulaUrl = `/perfil/${idTerapeuta}/cedula`;
        fetch(cedulaUrl, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }).then(res => {
            if (res.ok) {
                // Detectar si es PDF o imagen
                const contentType = res.headers.get("Content-Type");
                
                //if (contentType.includes("pdf")) {
                    // PDF → insertar <iframe> para vista previa
                    //const iframe = document.createElement("iframe");
                    //iframe.src = cedulaUrl;
                    //iframe.width = "100%";
                    //iframe.height = "200px";
                    //iframe.style.border = "none";
                    //iframe.style.borderRadius = "8px";
                    //iframe.style.marginTop = "10px";
                    // 🛡️ Agrega sandbox aquí
                    //iframe.setAttribute("sandbox", "");
                    //cedulaPreview.appendChild(iframe);

                //} else if (contentType.startsWith("image/")) {
                    // Imagen → mostrar en <img>
                    //cedulaImage.src = cedulaUrl;
                    //cedulaImage.style.display = 'block';
                //}

                // Botón para ver completo
                const link = document.createElement("a");
                link.href = cedulaUrl;
                link.target = "_blank";
                link.innerText = "📄 Ver cédula completa";
                link.classList.add("pdf-link");
                link.style.marginTop = "10px";
                cedulaPreview.appendChild(link);

                cedulaPreview.style.display = 'flex';

            } else if (res.status === 404) {
                console.warn("⚠️ No se encontró cédula profesional aún");
            }
        });
       

        
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
    } else {
        console.warn("⚠️ No se encontraron elementos para la cédula profesional");
    }

    // Modal para foto de perfil
    window.handleUploadClick = function (event) {
        event?.preventDefault();  // ✅ Evita comportamiento por defecto si el evento se pasa
        const fileInput = document.getElementById('file-input');
        if (fileInput.disabled) {
            mostrarAlertaModal("Subida de foto no permitida", "✏️ Primero debes presionar <strong>Editar</strong> para activar este campo.");
            return;
        }
        fileInput.click();
    };

    // Modal para cédula profesional
    window.handleCedulaClick = function () {
        const cedulaInput = document.getElementById('cedula-upload');
        if (cedulaInput.disabled) {
            mostrarAlertaModal("Subida de cédula no permitida", "✏️ Primero debes presionar <strong>Editar</strong> para activar este campo.");
            return;
        }
        cedulaInput.click();
    };

    // Función genérica para mostrar el modal
    function mostrarAlertaModal(titulo, mensaje) {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";

        const modal = document.createElement("div");
        modal.className = "modal-confirm";

        modal.innerHTML = `
            <h2>${titulo}</h2>
            <p>${mensaje}</p>
            <div class="modal-buttons">
                <button class="btn-secondary" id="cerrarAlertaModal">Cerrar</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById("cerrarAlertaModal").onclick = () => {
            overlay.remove();
        };
    }

    
    

    // ===== CÓDIGO PARA MANEJO DE IMAGEN DE PERFIL =====
    const fileInput = document.getElementById('file-input');
    const profilePhoto = document.getElementById('profile-photo');
    
    if (fileInput && profilePhoto) {
        // Deshabilitar la carga de imagen al iniciar
        fileInput.disabled = true;
        
        // Cargar imagen guardada en localStorage (si existe)
        const fotoUrl = `/perfil/${idTerapeuta}/foto`;
        fetch(fotoUrl, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }).then(res => {
            if (res.ok) {
                profilePhoto.src = fotoUrl;
            } else {
                profilePhoto.src = "/static/images/utec.png"; // 🧠 ruta de imagen por defecto
                console.warn("⚠️ Imagen de perfil no encontrada, se usa imagen por defecto.");
            }
        });


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
    } else {
        console.warn("⚠️ No se encontraron elementos para la foto de perfil");
    }

    // ===== CÓDIGO PARA GUARDAR CAMBIOS =====
    saveBtn.addEventListener("click", async function () {
        // Función para obtener valor de manera segura
        function safelyGetValue(selector, key) {
            const element = document.querySelector(selector);
            if (element) {
                return element.value.trim();
            } else {
                console.warn(`⚠️ Elemento no encontrado al guardar: ${selector}`);
                return null;
            }
        }

        // Obtener todos los datos del formulario
        const updatedData = {
            "nombre": safelyGetValue("input[placeholder='Nombre']"),
            "primer_apellido": safelyGetValue("input[placeholder='Primer apellido']"),
            "segundo_apellido": safelyGetValue("input[placeholder='Segundo apellido']"),
            "correo": safelyGetValue("input[placeholder='Correo electrónico']"),
            "codigo_postal": safelyGetValue("input[placeholder='Código Postal']"),
            "calle": safelyGetValue("input[placeholder='Calle']"),
            "colonia": safelyGetValue("input[placeholder='Colonia']"),
            "num_ext": safelyGetValue("input[placeholder='Número exterior']"),
            "num_int": safelyGetValue("input[placeholder='Número interior']"),
        };
    
        // Agregar nombre_usuario porque FastAPI lo requiere
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

            // Subir imagen y PDF a backend si hay archivos seleccionados
            const formData = new FormData();

            if (fileInput.files.length > 0) {
                const img = fileInput.files[0];
                if (!img.type.startsWith("image/")) {
                    alert("❌ Solo se permiten imágenes para la foto de perfil");
                    return;
                }
                formData.append("imagen", img);
            }

            if (cedulaUpload.files.length > 0) {
                const pdf = cedulaUpload.files[0];
                if (pdf.type !== "application/pdf") {
                    alert("❌ Solo se permite PDF para la cédula profesional");
                    return;
                }
                formData.append("cedula", pdf);
            }

            if (formData.has("imagen") || formData.has("cedula")) {
                try {
                    const uploadResponse = await fetch(`/perfil/${idTerapeuta}/subir-archivos`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (!uploadResponse.ok) {
                        throw new Error("❌ Error al subir archivos");
                    }

                    console.log("✅ Archivos subidos correctamente");

                } catch (error) {
                    console.error(error);
                    alert("❌ Error al subir imagen o PDF");
                }
            }

    
            if (!response.ok) {
                const errorResponse = await response.json();
                console.error("❌ Error en la respuesta del servidor:", JSON.stringify(errorResponse, null, 2));
                throw new Error("Error al actualizar el perfil");
            }
    
            const successAlert = document.getElementById("successAlert");
            if (successAlert) {
                successAlert.classList.add("show");
        
                setTimeout(() => {
                    successAlert.classList.remove("show");
                }, 3000);
            } else {
                console.warn("⚠️ Elemento #successAlert no encontrado");
                alert("¡Perfil actualizado correctamente!");
            }
            
            console.log("✅ Perfil actualizado correctamente");
    
        } catch (error) {
            console.error("❌ Error al actualizar perfil:", error);
            alert("Error al actualizar el perfil. Intente nuevamente.");
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

    window.scrollTo(0, 0);
});


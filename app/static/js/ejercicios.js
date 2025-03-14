document.addEventListener("DOMContentLoaded", function () {
    const pacienteId = localStorage.getItem("id_paciente");

    if (!pacienteId) {
        alert("No hay paciente seleccionado.");
        window.location.href = "/principal"; // Redirigir si no hay paciente
        return;
    }

    cargarNiveles(pacienteId);
});

async function cargarNiveles(pacienteId) {
    try {
        const response = await fetch(`/api/pacientes/${pacienteId}/niveles`); // Modificar la ruta con el id_paciente
        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

        const niveles = await response.json();
        if (!Array.isArray(niveles)) {
            throw new Error("La API no devolvió una lista de niveles válida.");
        }

        const menuContainer = document.getElementById("levels-menu");
        menuContainer.innerHTML = ""; // Limpiar contenido previo

        niveles.forEach(async (nivel) => {
            const nivelContainer = document.createElement("div");
            nivelContainer.classList.add("level-container");
            nivelContainer.setAttribute("data-level", nivel.id_nivel);

            const ejercicios = await obtenerEjercicios(pacienteId, nivel.id_nivel);

            nivelContainer.innerHTML = `
                <div class="level-row">
                    <div class="level-indicator ${nivel.estado === "desbloqueado" ? "unlocked" : "locked"}"></div>
                    <div class="level-name">${nivel.nombre_nivel}</div>
                    <button class="lock-button" onclick="toggleLock(this, ${pacienteId}, ${nivel.id_nivel})">
                        <i class="lock-icon">${nivel.estado === "desbloqueado" ? "🔓" : "🔒"}</i>
                    </button>
                    <button class="arrow-button" onclick="toggleDescription(this)">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="level-description">
                    <div class="text-content">
                        <p>${nivel.descripcion}</p>
                        <h4>Ejercicios:</h4>
                        <ul class="exercise-list">
                            ${ejercicios.map(ej => `
                                <li>
                                    <strong>${ej.nom_ejercicio}</strong>
                                    <p>${ej.instrucciones}</p>
                                </li>
                            `).join("")}
                        </ul>
                    </div>
                    <div class="video-container">
                        ${ejercicios.map(ej => {
                            const videoId = obtenerYouTubeID(ej.video_url);
                            return videoId ? `<iframe width="300" height="200" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`
                                        : `<p style="color:red;">No se puede mostrar el video</p>`;
                        }).join("")}
                    </div>
                </div>
            `;

            menuContainer.appendChild(nivelContainer);
        });
    } catch (error) {
        console.error("Error al cargar niveles:", error);
    }
}

// 📌 Función para obtener el ID del video de YouTube desde la URL
function obtenerYouTubeID(url) {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/[^\/]+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}




async function obtenerEjercicios(pacienteId, id_nivel) {
    try {
        const response = await fetch(`/api/pacientes/${pacienteId}/niveles/${id_nivel}/ejercicios`);
        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error al obtener ejercicios del nivel ${id_nivel}:`, error);
        return [];
    }
}


async function toggleLock(button, pacienteId, id_nivel) {
    // Obtener el contenedor del nivel y sus elementos
    const levelContainer = button.closest(".level-container");
    const lockIcon = button.querySelector(".lock-icon");
    const indicator = levelContainer.querySelector(".level-indicator");
    const levelName = levelContainer.querySelector(".level-name").textContent.trim(); // 🔹 Obtener el nombre del nivel

    let nuevoEstado = lockIcon.textContent === "🔒" ? "desbloqueado" : "bloqueado";

    try {
        const response = await fetch(`/api/pacientes/${pacienteId}/niveles/${id_nivel}?estado=${nuevoEstado}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("No se pudo actualizar el nivel");

        // Cambiar visualmente el estado del nivel
        if (nuevoEstado === "desbloqueado") {
            lockIcon.textContent = "🔓";
            indicator.classList.remove("locked");
            indicator.classList.add("unlocked");
            showMessage(`¡${levelName} desbloqueado!`, "success"); // 🔹 Mostrar el nombre del nivel
        } else {
            lockIcon.textContent = "🔒";
            indicator.classList.remove("unlocked");
            indicator.classList.add("locked");
            showMessage(`${levelName} bloqueado`, "error"); // 🔹 Mostrar el nombre del nivel
        }
    } catch (error) {
        console.error("Error al actualizar el estado del nivel:", error);
        showMessage("Error al cambiar el estado del nivel", "error");
    }
}



// Función para mostrar/ocultar la descripción del nivel
function toggleDescription(button) {
    button.classList.toggle("open");
    const description = button.parentNode.nextElementSibling;
    description.classList.toggle("open");
}

// Función para mostrar mensajes de notificación
function showMessage(text, type = "success") {
    const messageContainer = document.getElementById("message-container");
    
    const message = document.createElement("div");
    message.className = `message ${type}`;
    message.textContent = text;

    messageContainer.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 3000);
}

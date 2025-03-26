document.addEventListener("DOMContentLoaded", function () {
    const pacienteId = localStorage.getItem("id_paciente");

    if (!pacienteId) {
        alert("No hay paciente seleccionado.");
        window.location.href = "/principal";
        return;
    }

    cargarNiveles(pacienteId);
});

async function cargarNiveles(pacienteId) {
    try {
        const response = await fetch(`/api/pacientes/${pacienteId}/niveles`);
        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

        const niveles = await response.json();
        if (!Array.isArray(niveles)) {
            throw new Error("La API no devolvió una lista de niveles válida.");
        }

        // Ordenar niveles de forma ascendente por ID
        niveles.sort((a, b) => a.id_nivel - b.id_nivel);

        const menuContainer = document.getElementById("levels-menu");
        menuContainer.innerHTML = "";

        const nombresNiveles = [
            "Introducción al Movimiento",
            "Movilidad Básica",
            "Equilibrio Fundamental",
            "Coordinación Motora Inicial",
            "Fuerza y Estabilidad",
            "Resistencia Funcional",
            "Flexibilidad Avanzada",
            "Integración Neuromotora Completa"
        ];

        const estadosNiveles = new Map();

        niveles.forEach((nivel, index) => {
            nivel.nombre_nivel = `Nivel ${index + 1}: ${nombresNiveles[index]}`;

            if (index > 0) {
                const estadoNivelAnterior = estadosNiveles.get(index) || "bloqueado";
                
                if (estadoNivelAnterior === "bloqueado") {
                    nivel.estado = "bloqueado";
                }
            }

            estadosNiveles.set(index + 1, nivel.estado);
        });

        // Procesar niveles de forma secuencial
        for (const [index, nivel] of niveles.entries()) {
            const nivelContainer = document.createElement("div");
            nivelContainer.classList.add("level-container");
            nivelContainer.setAttribute("data-level", nivel.id_nivel);

            // Obtener ejercicios ordenados
            const ejercicios = await obtenerEjercicios(pacienteId, nivel.id_nivel);

            nivelContainer.innerHTML = `
                <div class="level-row">
                    <div class="level-indicator ${nivel.estado === "desbloqueado" ? "unlocked" : "locked"}"></div>
                    <div class="level-name">${nivel.nombre_nivel}</div>
                    <button class="lock-button" onclick="toggleLock(this, ${pacienteId}, ${nivel.id_nivel}, ${index + 1})">
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
        }
    } catch (error) {
        console.error("Error al cargar niveles:", error);
    }
}

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
        const ejercicios = await response.json();
        
        // Ordenar ejercicios por ID o por el orden que quieras
        return ejercicios.sort((a, b) => a.id_ejercicio - b.id_ejercicio);
    } catch (error) {
        console.error(`Error al obtener ejercicios del nivel ${id_nivel}:`, error);
        return [];
    }
}

async function toggleLock(button, pacienteId, id_nivel, nivelNumero) {
    const levelContainer = button.closest(".level-container");
    const lockIcon = button.querySelector(".lock-icon");
    const indicator = levelContainer.querySelector(".level-indicator");
    const levelName = levelContainer.querySelector(".level-name").textContent.trim();

    const niveles = Array.from(document.querySelectorAll(".level-container"));
    const currentIndex = niveles.findIndex(nivel => nivel === levelContainer);

    for (let i = 0; i < currentIndex; i++) {
        const previousLevelLockIcon = niveles[i].querySelector(".lock-icon");
        if (previousLevelLockIcon.textContent === "🔒") {
            showMessage(`Debes desbloquear primero los niveles anteriores`, "error");
            return;
        }
    }

    let nuevoEstado = lockIcon.textContent === "🔒" ? "desbloqueado" : "bloqueado";

    try {
        const response = await fetch(`/api/pacientes/${pacienteId}/niveles/${id_nivel}?estado=${nuevoEstado}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("No se pudo actualizar el nivel");

        if (nuevoEstado === "desbloqueado") {
            lockIcon.textContent = "🔓";
            indicator.classList.remove("locked");
            indicator.classList.add("unlocked");
            showMessage(`¡${levelName} desbloqueado!`, "success");
        } else {
            lockIcon.textContent = "🔒";
            indicator.classList.remove("unlocked");
            indicator.classList.add("locked");
            showMessage(`${levelName} bloqueado`, "error");
        }
    } catch (error) {
        console.error("Error al actualizar el estado del nivel:", error);
        showMessage("Error al cambiar el estado del nivel", "error");
    }
}

function toggleDescription(button) {
    button.classList.toggle("open");
    const description = button.parentNode.nextElementSibling;
    description.classList.toggle("open");
}

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

document.addEventListener("DOMContentLoaded", () => {
    const homeButton = document.querySelector(".home-button");
    if (homeButton) {
        homeButton.addEventListener("click", async (e) => {
            e.preventDefault();

            const sesionId = localStorage.getItem("id_sesion");

            if (sesionId) {
                try {
                    await fetch(`/dispositivos/desactivar/${sesionId}`, {
                        method: "PUT"
                    });
                    console.log("🔌 Dispositivos desactivados correctamente.");
                } catch (error) {
                    console.error("❌ Error al desactivar dispositivos:", error);
                }
            }

            console.log("🏠 Limpiando localStorage al volver a principal...");
            localStorage.removeItem("id_sesion");
            localStorage.removeItem("nombre_sesion");
            localStorage.removeItem("sesion_dispositivo_ids");

            window.location.href = "/principal";
        });
    }
});
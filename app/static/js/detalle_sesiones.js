// 📌 Función para mostrar mensajes de éxito o error con el diseño personalizado
function mostrarMensaje(mensaje, tipo = "success") {
    const alertBox = document.createElement("div");
    alertBox.classList.add("alert", tipo === "success" ? "success" : "error");
    alertBox.innerHTML = `
        <span class="alert-icon">${tipo === "success" ? "✅" : "❌"}</span> 
        ${mensaje}
    `;
    document.body.appendChild(alertBox);

    setTimeout(() => alertBox.classList.add("show"), 100);
    setTimeout(() => {
        alertBox.classList.remove("show");
        setTimeout(() => alertBox.remove(), 300);
    }, 3000);
}

document.addEventListener("DOMContentLoaded", async () => {
    let idSesion = localStorage.getItem("id_sesion");
    const nombreSesion = localStorage.getItem("nombre_sesion"); // ✅ Obtener el nombre de la sesión

    if (!idSesion) {
        mostrarMensaje("No hay sesión seleccionada.", "error");
        window.location.href = "/sesiones";
        return;
    }

    try {
        // 📌 Obtener detalles de la sesión desde la API
        const response = await fetch(`/detalle_sesiones/${idSesion}`);
        if (!response.ok) throw new Error("Error obteniendo la sesión");

        const sesion = await response.json();

        // ✅ Mostrar el nombre de la sesión en lugar del ID
        document.getElementById("session-title").textContent = nombreSesion || `Sesión ${idSesion}`;  
        document.getElementById("session-description").value = sesion.descripcion_sesion || "";
        document.getElementById("nota-evolutiva").value = sesion.nota_evolutiva || "";

        console.log("📌 Datos de la sesión recibidos:", sesion);

        // 📌 Mostrar la fecha y la hora formateadas
        const fechaISO = sesion.fecha_inicio;
        const fechaFormateada = new Date(fechaISO + "T00:00:00").toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const horaISO = sesion.hora_inicio;
        const horaSinZona = horaISO.split("T")[1].split("+")[0];
        const [hora, minutos] = horaSinZona.split(":");
        const horaNumerica = parseInt(hora, 10);
        const ampm = horaNumerica >= 12 ? "PM" : "AM";
        const hora12 = horaNumerica % 12 || 12;

        const horaFormateada = `${hora12}:${minutos} ${ampm}`;

        document.getElementById("session-date").textContent = `📅 ${fechaFormateada}`;
        document.getElementById("session-time").textContent = `⏰ ${horaFormateada}`;

        // 📌 Evento para actualizar la nota evolutiva
        document.getElementById("nota-evolutiva").addEventListener("change", async () => {
            try {
                const updateResponse = await fetch(`/detalle_sesiones/${idSesion}/nota`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nota_evolutiva: document.getElementById("nota-evolutiva").value })
                });

                if (!updateResponse.ok) throw new Error("Error al actualizar la nota");
                mostrarMensaje("Nota evolutiva actualizada correctamente", "success");

            } catch (error) {
                mostrarMensaje("Error al actualizar la nota evolutiva", "error");
                console.error(error);
            }
        });

        // 📌 **Evento para actualizar la descripción**
        document.getElementById("session-description").addEventListener("change", async () => {
            try {
                const updateResponse = await fetch(`/detalle_sesiones/${idSesion}/descripcion`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ descripcion_sesion: document.getElementById("session-description").value })
                });

                if (!updateResponse.ok) throw new Error("Error al actualizar la descripción");
                mostrarMensaje("Descripción actualizada correctamente", "success");

            } catch (error) {
                mostrarMensaje("Error al actualizar la descripción", "error");
                console.error(error);
            }
        });

        // 📌 Evento para salir del detalle de sesión y volver a la lista de sesiones
        const salirDetalleBtn = document.getElementById("salir-detalle");
        if (salirDetalleBtn) {
            salirDetalleBtn.addEventListener("click", () => {
                console.log("🗑️ Saliendo del detalle de sesión.");
                localStorage.removeItem("id_sesion");
                localStorage.removeItem("nombre_sesion");
                window.location.href = "/sesiones";
            });
        }

    } catch (error) {
        console.error(error);
        mostrarMensaje("Error cargando la sesión", "error");
    }

    document.getElementById("btn-grafica").addEventListener("click", () => {
        cargarGrafica(); // 📌 Llamará a la función de grafica.js
    });
    
    document.getElementById("btn-tabla").addEventListener("click", () => {
        cargarTablaMediapipe(); // 📌 Llamará a la función de tabla_mediapipe.js
    });
    
});

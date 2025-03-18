document.addEventListener("DOMContentLoaded", async () => {
    let idSesion = localStorage.getItem("id_sesion");
    const nombreSesion = localStorage.getItem("nombre_sesion"); // ✅ Obtener el nombre de la sesión

    if (!idSesion) {
        alert("No hay sesión seleccionada.");
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
        document.getElementById("session-description").textContent = sesion.descripcion_sesion;
        console.log("📌 Datos de la sesión recibidos:", sesion);
        console.log("📌 Fecha sin procesar:", sesion.fecha_inicio);
        console.log("📌 Hora sin procesar:", sesion.hora_inicio);


        // ✅ Mostrar la fecha y la hora formateadas
        // 📌 Extraer la fecha sin alterar la zona horaria
        const fechaISO = sesion.fecha_inicio; // "2025-03-17"
        const fechaFormateada = new Date(fechaISO + "T00:00:00").toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        // 📌 Extraer y convertir la hora a formato de 12 horas
        // 📌 Extraer solo la hora de la cadena sin conversión de zona horaria
        const horaISO = sesion.hora_inicio; // "2025-03-17T22:27:00+00:00"
        const horaSinZona = horaISO.split("T")[1].split("+")[0]; // "22:27:00"

        // 📌 Convertir a formato de 12 horas (AM/PM)
        const [hora, minutos] = horaSinZona.split(":"); // ["22", "27"]
        const horaNumerica = parseInt(hora, 10);
        const ampm = horaNumerica >= 12 ? "PM" : "AM";
        const hora12 = horaNumerica % 12 || 12; // Convierte 0 en 12 para formato de 12 horas

        const horaFormateada = `${hora12}:${minutos} ${ampm}`;


        document.getElementById("session-date").textContent = `📅 ${fechaFormateada}`;
        // 📌 Mostrar la hora en la interfaz
        document.getElementById("session-time").textContent = `⏰ ${horaFormateada}`;

        // 📌 Mostrar la nota evolutiva si existe
        const notaTextarea = document.getElementById("nota-evolutiva");
        notaTextarea.value = sesion.nota_evolutiva || "";

        // 📌 Evento para actualizar la nota evolutiva
        notaTextarea.addEventListener("change", async () => {
            try {
                const updateResponse = await fetch(`/detalle_sesiones/${idSesion}/nota`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nota_evolutiva: notaTextarea.value })  // 📌 Enviar JSON correctamente
                });

                if (!updateResponse.ok) throw new Error("Error al actualizar la nota");
                alert("Nota evolutiva actualizada correctamente");

            } catch (error) {
                alert("Error al actualizar la nota evolutiva");
                console.error(error);
            }
        });

        // 📌 Evento para salir del detalle de sesión y volver a la lista de sesiones
        const salirDetalleBtn = document.getElementById("salir-detalle");
        if (salirDetalleBtn) {
            salirDetalleBtn.addEventListener("click", () => {
                console.log("🗑️ Saliendo del detalle de sesión.");
                localStorage.removeItem("id_sesion");  // ✅ Eliminar la sesión activa
                localStorage.removeItem("nombre_sesion");  // ✅ Eliminar el nombre de la sesión
                window.location.href = "/sesiones";  // ✅ Redirigir a la lista de sesiones
            });
        }

    } catch (error) {
        console.error(error);
        alert("Error cargando la sesión");
    }
});

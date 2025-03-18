document.addEventListener("DOMContentLoaded", async () => {
    let idSesion = localStorage.getItem("id_sesion");

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

        // 📌 Rellenar los datos en la interfaz
        document.getElementById("session-title").textContent = `Sesión ${idSesion}`;
        document.getElementById("session-description").textContent = sesion.descripcion_sesion;

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
                window.location.href = "/sesiones";  // ✅ Redirigir a la lista de sesiones
            });
        }

    } catch (error) {
        console.error(error);
        alert("Error cargando la sesión");
    }
});

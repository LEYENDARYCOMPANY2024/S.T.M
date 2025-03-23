const supabase = window.supabase.createClient(
    'https://hxjmzijhcmhfcrjcptge.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4am16aWpoY21oZmNyamNwdGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwODMxODgsImV4cCI6MjA1NTY1OTE4OH0.fZ1QaYkFTfJTdupOUkV7V9a7kIIVHCt_XusnNWxkyqw'
);

let chartData = {
    labels: [],
    derecha: [],
    izquierda: []
};

let chart = null;
let realtimePaused = false;
const MAX_DATA_POINTS = 30;

function mostrarMensaje(mensaje, tipo = "success") {
    const alertBox = document.createElement("div");
    alertBox.classList.add("alert", tipo === "success" ? "success" : "error");
    alertBox.innerHTML = `<span class="alert-icon">${tipo === "success" ? "✅" : "❌"}</span> ${mensaje}`;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.classList.add("show"), 100);
    setTimeout(() => {
        alertBox.classList.remove("show");
        setTimeout(() => alertBox.remove(), 300);
    }, 3000);
}

function limitData() {
    if (chartData.labels.length > MAX_DATA_POINTS) {
        chartData.labels.shift();
        chartData.derecha.shift();
        chartData.izquierda.shift();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const chartCanvas = document.getElementById("grafica_realtime");
    chart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Pierna Derecha',
                    borderColor: 'red',
                    data: chartData.derecha,
                    fill: false
                },
                {
                    label: 'Pierna Izquierda',
                    borderColor: 'blue',
                    data: chartData.izquierda,
                    fill: false
                }
            ]
        },
        options: {
            animation: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    document.getElementById("importInput").addEventListener("change", importarCSV);
});

async function exportarGraficaCSV() {
    const ids = JSON.parse(localStorage.getItem("sesion_dispositivo_ids"));
    if (!ids || ids.length === 0) {
        mostrarMensaje("⚠️ No hay sesión/dispositivo activo para exportar.", "error");
        return;
    }

    // Por ahora exportamos solo el primero (podrías hacer selección múltiple si quieres)
    const id = ids[0];

    try {
        const response = await fetch(`/graficas/exportar_historial/${id}`);
        if (!response.ok) {
            throw new Error("No se pudo exportar el historial.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `historial_grafica_${id}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        mostrarMensaje("✅ CSV exportado correctamente desde historial.");

    } catch (error) {
        console.error("❌ Error exportando CSV:", error);
        mostrarMensaje("❌ No se pudo exportar el historial", "error");
    }
}

function suscribirseAGraficasRealtime() {
    const ids = JSON.parse(localStorage.getItem("sesion_dispositivo_ids"));
    if (!ids || ids.length === 0) return;

    supabase
        .channel('graficas_realtime')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'graficas'
        }, payload => {
            if (realtimePaused) return;

            const data = payload.new;
            if (!ids.includes(data.id_sesion_dispositivo_fk)) return;

            const timestamp = new Date(data.fecha_hora).toLocaleTimeString(); // HH:MM:SS

            chartData.labels.push(timestamp);

            if (data.lado_pierna === 'derecha') {
                chartData.derecha.push(data.aceleracion_y);
                chartData.izquierda.push(0);
            } else {
                chartData.izquierda.push(data.aceleracion_y);
                chartData.derecha.push(0);
            }

            limitData();
            chart.update();
        })
        .subscribe();
}


function togglePause() {
    realtimePaused = !realtimePaused;
    document.getElementById("pauseButton").textContent = realtimePaused ? "Reanudar" : "Pausar";
    mostrarMensaje(realtimePaused ? "⏸️ Pausado" : "▶️ Reanudado");
}

function reiniciarGrafica() {
    chartData.labels = [];
    chartData.derecha = [];
    chartData.izquierda = [];
    chart.update();
    mostrarMensaje("🔄 Gráfica reiniciada");
}

async function importarCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const etiqueta = prompt("Etiqueta para los datos importados:", "importacion_manual");
    if (etiqueta) formData.append("etiqueta", etiqueta);

    try {
        const response = await fetch("/graficas/importar", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        mostrarMensaje(result.mensaje, "success");

    } catch (error) {
        mostrarMensaje("Error al importar CSV", "error");
        console.error("Error al importar CSV:", error);
    }
}

async function enviarDatosAlESP(uuid, id_paciente, id_sesion_dispositivo, lado_pierna) {
    try {
        const response = await fetch("/esp/configurar_paciente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                uuid,
                id_paciente,
                id_sesion_dispositivo,
                lado_pierna
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log("📡 Config enviado al ESP:", data);
        } else {
            console.error("❌ Error al enviar config al ESP:", data);
        }
    } catch (error) {
        console.error("❌ Error de red al enviar config al ESP:", error);
    }
}


async function cargarDispositivosActivos() {
    const response = await fetch("/dispositivos/activos");
    const dispositivos = await response.json();

    let contenedor = document.getElementById("dispositivos-activos");
    contenedor.innerHTML = "";

    if (dispositivos.length === 0) {
        contenedor.innerHTML = "<p style='color: white;'>⚠️ No hay dispositivos activos aún.</p>";
        return;
    }

    dispositivos.forEach(dispositivo => {
        const select = document.createElement("select");
        select.innerHTML = `
            <option value="">Selecciona pierna</option>
            <option value="izquierda" ${dispositivo.pierna === "izquierda" ? "selected" : ""}>Izquierda</option>
            <option value="derecha" ${dispositivo.pierna === "derecha" ? "selected" : ""}>Derecha</option>
        `;
        select.onchange = async () => {
            const nuevoLado = select.value;
        
            await fetch(`/dispositivos/lado_pierna/${dispositivo.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lado: nuevoLado })
            });
        
            // 🔄 Guardar el lado localmente
            localStorage.setItem(`lado_pierna_${dispositivo.id}`, nuevoLado);
        
            // 📡 Volver a enviar al ESP si ya está activo
            const ids = JSON.parse(localStorage.getItem("sesion_dispositivo_ids")) || [];
            if (ids.includes(dispositivo.id)) {
                const uuid = dispositivo.uuid;
                const id_paciente = localStorage.getItem("id_paciente");
                await enviarDatosAlESP(uuid, parseInt(id_paciente), dispositivo.id, nuevoLado);
            }
        
            mostrarMensaje("Lado actualizado correctamente", "success");
        };        

        let row = document.createElement("div");
        row.innerHTML = `<strong>${dispositivo.nombre}</strong>`;
        row.appendChild(select);
        contenedor.appendChild(row);
    });
}

suscribirseAGraficasRealtime();
cargarDispositivosActivos();

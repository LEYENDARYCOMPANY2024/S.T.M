const supabase = window.supabase.createClient(
    'https://hxjmzijhcmhfcrjcptge.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4am16aWpoY21oZmNyamNwdGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwODMxODgsImV4cCI6MjA1NTY1OTE4OH0.fZ1QaYkFTfJTdupOUkV7V9a7kIIVHCt_XusnNWxkyqw'
);


let chartData = {
    derecha: {
        labels: [],
        data: [],
        color: 'red'
    },
    izquierda: {
        labels: [],
        data: [],
        color: 'blue'
    }
};

let chart = null;
let realtimePaused = false;  // Renombrado para evitar conflicto con MediaPipe
const MAX_DATA_POINTS = 30;

// 📌 Función para mostrar mensajes con el mismo estilo de principal.js
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


function limitData(arr) {
    if (arr.length > MAX_DATA_POINTS) arr.shift();
}

document.addEventListener("DOMContentLoaded", () => {
    const chartCanvas = document.getElementById("grafica_realtime");
    chartCanvas.id = "grafica_realtime";

    chart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Pierna Derecha',
                    borderColor: chartData.derecha.color,
                    data: chartData.derecha.data,
                    fill: false
                },
                {
                    label: 'Pierna Izquierda',
                    borderColor: chartData.izquierda.color,
                    data: chartData.izquierda.data,
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

    // ⬇️ Botón Importar CSV
    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = ".csv";
    importInput.style.display = "none";
    importInput.addEventListener("change", importarCSV);
    document.body.appendChild(importInput);

    const importBtn = document.createElement("button");
    importBtn.textContent = "Importar CSV";
    importBtn.className = "btn-info";
    importBtn.onclick = () => importInput.click();
});


function exportarGraficaCSV() {
    if (!chart || !chart.data.labels.length) {
        mostrarMensaje("❌ No hay datos para exportar.", "error");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Tiempo,Pierna Derecha,Pierna Izquierda\n";

    chart.data.labels.forEach((label, index) => {
        let derecha = chart.data.datasets[0].data[index] || 0;
        let izquierda = chart.data.datasets[1].data[index] || 0;
        csvContent += `${label},${derecha},${izquierda}\n`;
    });

    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "datos_grafica.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarMensaje("✅ Archivo CSV exportado con éxito.", "success");
}



function suscribirseAGraficasRealtime() {
    const ids = JSON.parse(localStorage.getItem("sesion_dispositivo_ids"));
    if (!ids || ids.length === 0) return;

    supabase
        .channel('graficas_realtime')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'graficas'
            },
            payload => {
                const data = payload.new;

                // Solo escuchar si el ID del sesion_dispositivo está en localStorage
                if (!ids.includes(data.id_sesion_dispositivo_fk)) return;

                const time = new Date().toLocaleTimeString();

                if (!chartData.derecha.labels.includes(time)) {
                    chartData.derecha.labels.push(time);
                    chartData.izquierda.labels.push(time);
                }

                if (data.lado_pierna === 'derecha') {
                    chartData.derecha.data.push(data.aceleracion_y);
                    chartData.izquierda.data.push(0);
                } else {
                    chartData.izquierda.data.push(data.aceleracion_y);
                    chartData.derecha.data.push(0);
                }

                limitData(chartData.derecha.labels);
                limitData(chartData.derecha.data);
                limitData(chartData.izquierda.labels);
                limitData(chartData.izquierda.data);

                chart.update();
            }
        )
        .subscribe();
}




function togglePause() {
    realtimePaused = !realtimePaused;
    document.getElementById("pauseButton").textContent = realtimePaused ? "Reanudar" : "Pausar";
    mostrarMensaje(realtimePaused ? "Gráfica pausada" : "Gráfica reanudada", "success");
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

async function cargarDispositivosActivos() {
    const response = await fetch("/dispositivos/activos");  // Asegúrate que esta ruta exista en tu backend
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
            await fetch(`/dispositivos/lado_pierna/${dispositivo.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lado: select.value })
            });            
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
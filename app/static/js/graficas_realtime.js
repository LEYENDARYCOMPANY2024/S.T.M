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

    startPolling();

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


function startPolling() {
    setInterval(() => {
        if (!realtimePaused) fetchData();  // Usamos realtimePaused
    }, 1000);
}

async function fetchData() {
    const sesionDispositivoId = localStorage.getItem("sesion_dispositivo_id");
    if (!sesionDispositivoId) return;

    const time = new Date().toLocaleTimeString();

    try {
        const response = await fetch(`/graficas/stream/${sesionDispositivoId}`);

        if (!response.ok) {
            // No hay datos aún, mantener gráfica en 0
            chartData.derecha.labels.push(time);
            chartData.derecha.data.push(0);
            chartData.izquierda.labels.push(time);
            chartData.izquierda.data.push(0);
            mostrarMensaje("Esperando datos del dispositivo...", "error");
        } else {
            const data = await response.json();
            if (data.lado_pierna === 'derecha') {
                chartData.derecha.labels.push(time);
                chartData.derecha.data.push(data.aceleracion_y);
            } else {
                chartData.izquierda.labels.push(time);
                chartData.izquierda.data.push(data.aceleracion_y);
            }
        }

        limitData(chartData.derecha.labels);
        limitData(chartData.derecha.data);
        limitData(chartData.izquierda.labels);
        limitData(chartData.izquierda.data);

        chart.update();
    } catch (err) {
        mostrarMensaje("Error al obtener datos de la gráfica", "error");
        console.error("Error al obtener datos de gráfica:", err);
    }
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


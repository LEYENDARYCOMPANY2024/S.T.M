const supabase = window.supabase.createClient(
  'https://hxjmzijhcmhfcrjcptge.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4am16aWpoY21oZmNyamNwdGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwODMxODgsImV4cCI6MjA1NTY1OTE4OH0.fZ1QaYkFTfJTdupOUkV7V9a7kIIVHCt_XusnNWxkyqw'
);

// 🟢 Variables diferenciadas
let chartjs_data = {
  labels: [],
  datasets: {
    izquierda: { ay: [] },
    derecha: { ay: [] }
  }
};

let chartjs_chart = null;
let chartjs_realtimePaused = true;
let chartjs_channel = null; // 🔁 Para gestionar el canal y cerrarlo si existe
let chartjs_importadosIzquierda = [];
let chartjs_importadosDerecha = [];
window.reinicioPendiente = false;
const chartjs_MAX_DATA = 30;

document.addEventListener("DOMContentLoaded", () => {
  const ctx = document.getElementById("grafica_chartjs").getContext("2d");

  chartjs_chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartjs_data.labels,
      datasets: [
        {
          label: "Pierna Izquierda",
          borderColor: "green",
          data: chartjs_data.datasets.izquierda.ay,
          fill: false
        },
        {
          label: "Pierna Derecha",
          borderColor: "red",
          data: chartjs_data.datasets.derecha.ay,
          fill: false
        }
      ]
    },
    options: {
      animation: false,
      responsive: true,
      elements: {
        line: { tension: 0 }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Aceleración Y' }
        },
        x: {
          title: { display: true, text: 'Hora' }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: 'white',
            font: { size: 14, weight: 'bold' }
          }
        }
      }
    }
  });

    const datosIzq = JSON.parse(localStorage.getItem("chartjs_import_izq") || "[]");
    const datosDer = JSON.parse(localStorage.getItem("chartjs_import_der") || "[]");

    chartjs_data.labels = datosIzq.map(p => new Date(p.timestamp).toLocaleTimeString());
    chartjs_data.datasets.izquierda.ay = datosIzq.map(p => p.value);
    chartjs_data.datasets.derecha.ay = datosDer.map(p => p.value);

    chartjs_importadosIzquierda = datosIzq;
    chartjs_importadosDerecha = datosDer;

    chartjs_chart.update();

  document.getElementById("importInput").addEventListener("change", chartjs_importarCSV);

  if (window.tipoGraficaActiva === "chartjs") {
    chartjs_suscribirRealtime();
    cargarDispositivosActivos();
  }
});

function chartjs_limitData() {
  if (chartjs_data.labels.length > chartjs_MAX_DATA) {
    chartjs_data.labels.shift();
    Object.values(chartjs_data.datasets).forEach(d => d.ay.shift());
  }
}

function chartjs_suscribirRealtime() {
  console.log("🎿 Subscribiendo CHART.JS a Supabase Realtime...");

  if (chartjs_channel) {
    supabase.removeChannel(chartjs_channel);
    console.log("🚩 Canal Chart.js anterior cerrado");
  }

  chartjs_channel = supabase
    .channel('grafica_chartjs')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'graficas'
    }, payload => {
      console.log("📱 Evento recibido en Chart.js");

      if (chartjs_realtimePaused) {
        console.warn("⏸️ Chart.js pausado, no procesa datos.");
        return;
      }

      const data = payload.new;
      const lado = data.lado_pierna_gf;
      const valor = data.aceleracion_y ?? 0;
      const fecha = new Date(data.fecha_hora);

      if (!lado || !chartjs_data.datasets[lado]) {
        console.warn("⚠️ Lado inválido:", lado);
        return;
      }

      console.log(`✅ CHART - ${lado} => ${valor} @ ${fecha.toLocaleTimeString()}`);
      chartjs_data.labels.push(fecha.toLocaleTimeString());
      chartjs_data.datasets[lado].ay.push(valor);
      chartjs_limitData();
      chartjs_chart.update('none');

      const ts = fecha.getTime(); // timestamp real

      if (lado === 'izquierda') {
        chartjs_importadosIzquierda.push({ timestamp: ts, value: valor });
        if (chartjs_importadosIzquierda.length > chartjs_MAX_DATA) {
          chartjs_importadosIzquierda.shift();
        }
        localStorage.setItem("chartjs_import_izq", JSON.stringify(chartjs_importadosIzquierda));
      } else if (lado === 'derecha') {
        chartjs_importadosDerecha.push({ timestamp: ts, value: valor });
        if (chartjs_importadosDerecha.length > chartjs_MAX_DATA) {
          chartjs_importadosDerecha.shift();
        }
        localStorage.setItem("chartjs_import_der", JSON.stringify(chartjs_importadosDerecha));
      }

    })
    .subscribe(s => {
      if (s === 'SUBSCRIBED') console.log("✅ Chart.js conectado a Realtime");
    });
}


function chartjs_reiniciarChartJS() {
  // Mostrar confirmación antes de reiniciar
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal-confirm";

  modal.innerHTML = `
    <h2>¿Reiniciar la gráfica?</h2>
    <p>⚠️ Esto eliminará los datos obtenidos e importados.<br>💾 Guarda tus datos antes de reiniciar.<br>¿Estás seguro de continuar?</p>
    <div class="modal-buttons">
      <button class="btn-secondary" id="cancelarReinicioChart">Cancelar</button>
      <button class="btn-danger" id="confirmarReinicioChart">Reiniciar</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById("cancelarReinicioChart").onclick = () => overlay.remove();

  document.getElementById("confirmarReinicioChart").onclick = async () => {
    overlay.remove();

    localStorage.removeItem("chartjs_import_izq");
    localStorage.removeItem("chartjs_import_der");
    chartjs_importadosIzquierda = [];
    chartjs_importadosDerecha = [];

    chartjs_data.labels = [];
    Object.values(chartjs_data.datasets).forEach(d => d.ay = []);
    chartjs_chart.update();
    chartjs_realtimePaused = false;
    document.getElementById("pauseButton").textContent = "Pausar";

    chartjs_mensaje("Gráfica reiniciada y datos eliminados");

    // 🧠 Reactivar envío de datos desde ESP
    try {
      const dispositivos = await fetch("/dispositivos/activos").then(r => r.json());
      for (const d of dispositivos) {
        await fetch(`/dispositivos/permiso_envio/${d.uuid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: true })
        });
      }
    } catch (err) {
      console.error("❌ Error reactivando envío desde el ESP:", err);
      chartjs_mensaje("❌ Error al reactivar envío en ESP", "error");
    }
  };
};



async function chartjs_togglePause() {
  chartjs_realtimePaused = !chartjs_realtimePaused;
  const btn = document.getElementById("pauseButton");
  btn.textContent = chartjs_realtimePaused ? "Iniciar" : "Pausar";
  chartjs_mensaje(chartjs_realtimePaused ? "Pausado" : "Reanudado");

  // ✅ Al iniciar (no está pausado), bloquea el cambio de tipo
  if (!chartjs_realtimePaused) window.reinicioPendiente = true;

  try {
    const dispositivos = await fetch("/dispositivos/activos").then(r => r.json());
    for (const d of dispositivos) {
      await fetch(`/dispositivos/permiso_envio/${d.uuid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: !chartjs_realtimePaused })
      });
    }
  } catch (err) {
    console.error("Error permiso_envio:", err);
    chartjs_mensaje("❌ Error controlando envío", "error");
  }
}

function chartjs_mensaje(msg, tipo = "success") {
  const alert = document.createElement("div");
  alert.classList.add("alert", tipo === "success" ? "success" : "error");
  alert.innerHTML = `<span class="alert-icon">${tipo === "success" ? "✅" : "❌"}</span> ${msg}`;
  document.body.appendChild(alert);
  setTimeout(() => alert.classList.add("show"), 100);
  setTimeout(() => {
    alert.classList.remove("show");
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}

function chartjs_exportarCSV() {
  const filas = [["hora", "izquierda_ay", "derecha_ay"]];
  for (let i = 0; i < chartjs_data.labels.length; i++) {
    filas.push([
      chartjs_data.labels[i],
      chartjs_data.datasets.izquierda.ay[i] ?? "",
      chartjs_data.datasets.derecha.ay[i] ?? ""
    ]);
  }
  const csv = filas.map(f => f.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "grafica_chartjs.csv";
  a.click();
  a.remove();
}

async function chartjs_importarCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function (e) {
    const contenido = e.target.result;
    const filas = contenido.split("\n").map(linea => linea.trim()).filter(Boolean);
    const encabezados = filas.shift().split(",");

    const idxHora = encabezados.indexOf("hora");
    const idxIzq = encabezados.indexOf("izquierda_ay");
    const idxDer = encabezados.indexOf("derecha_ay");

    if (idxHora === -1 || idxIzq === -1 || idxDer === -1) {
      chartjs_mensaje("⚠️ El CSV debe tener columnas: hora, izquierda_ay, derecha_ay", "error");
      return;
    }

    // ⏸️ Pausar la gráfica y actualizar botón
    chartjs_realtimePaused = true;
    document.getElementById("pauseButton").textContent = "Iniciar";

    // ⛔ Detener envío desde ESP32
    try {
      const dispositivos = await fetch("/dispositivos/activos").then(r => r.json());
      for (const d of dispositivos) {
        await fetch(`/dispositivos/permiso_envio/${d.uuid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: false })
        });
      }
      console.log("🚫 Envío de datos desde dispositivos pausado");
    } catch (err) {
      console.error("❌ Error al pausar dispositivos:", err);
    }

    // 🔄 Reemplazar datos actuales
    const ahora = Date.now();
    chartjs_data.labels = [];
    chartjs_data.datasets.izquierda.ay = [];
    chartjs_data.datasets.derecha.ay = [];

    for (let i = 0; i < filas.length; i++) {
      const columnas = filas[i].split(",");
      const offset = i * 1000;
      const ts = ahora + offset;

      const izq = parseFloat(columnas[idxIzq]) || 0;
      const der = parseFloat(columnas[idxDer]) || 0;

      chartjs_data.labels.push(new Date(ts).toLocaleTimeString());
      chartjs_data.datasets.izquierda.ay.push(izq);
      chartjs_data.datasets.derecha.ay.push(der);

      chartjs_importadosIzquierda.push({ timestamp: ts, value: izq });
      chartjs_importadosDerecha.push({ timestamp: ts, value: der });
    }

    localStorage.setItem("chartjs_import_izq", JSON.stringify(chartjs_importadosIzquierda));
    localStorage.setItem("chartjs_import_der", JSON.stringify(chartjs_importadosDerecha));
    chartjs_chart.update();

    chartjs_mensaje("CSV importado y graficado correctamente");
  };

  reader.readAsText(file);
}



async function enviarDatosAlESP(uuid, id_paciente, id_sesion_dispositivo, lado_pierna) {
  const response = await fetch("/esp/configurar_paciente", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uuid, id_paciente, id_sesion_dispositivo, lado_pierna })
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("❌ Error al enviar config al ESP:", data);
  }
}

async function cargarDispositivosActivos() {
  try {
    const response = await fetch("/dispositivos/activos");
    if (!response.ok) throw new Error("Error al obtener dispositivos activos");
    const dispositivos = await response.json();

    const contenedor = document.getElementById("dispositivos-activos");
    contenedor.innerHTML = "";
    if (dispositivos.length === 0) {
      contenedor.innerHTML = "<p style='color: white;'>⚠️ No hay dispositivos activos aún.</p>";
      return;
    }

    dispositivos.forEach(async (dispositivo) => {
      const select = document.createElement("select");
      select.innerHTML = `
        <option value="">Selecciona pierna</option>
        <option value="izquierda" ${dispositivo.pierna === "izquierda" ? "selected" : ""}>Izquierda</option>
        <option value="derecha" ${dispositivo.pierna === "derecha" ? "selected" : ""}>Derecha</option>`;

      const estadoSpan = document.createElement("span");
      estadoSpan.className = "estado-envio";
      estadoSpan.textContent = "Cargando...";

      try {
        const permiso = await fetch(`/dispositivos/permiso_envio/${dispositivo.uuid}`).then(r => r.json());
        const activo = permiso.permite;
        estadoSpan.classList.add(activo ? "status-true" : "status-false");
        estadoSpan.textContent = activo ? "Envío activo" : "Pausado";
      } catch (err) {
        estadoSpan.classList.add("status-false");
        estadoSpan.textContent = "Error";
      }

      select.onchange = async () => {
        const nuevoLado = select.value;
        await fetch(`/dispositivos/lado_pierna/${dispositivo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lado: nuevoLado })
        });

        localStorage.setItem(`lado_pierna_${dispositivo.id}`, nuevoLado);
        const ids = JSON.parse(localStorage.getItem("sesion_dispositivo_ids")) || [];
        if (ids.includes(dispositivo.id)) {
          const uuid = dispositivo.uuid;
          const id_paciente = localStorage.getItem("id_paciente");
          await enviarDatosAlESP(uuid, parseInt(id_paciente), dispositivo.id, nuevoLado);
        }

        chartjs_mensaje("Lado actualizado correctamente", "success");
      };

      const row = document.createElement("div");
      row.innerHTML = `<strong>${dispositivo.nombre}</strong>`;
      row.appendChild(select);
      row.appendChild(estadoSpan);
      contenedor.appendChild(row);
    });
  } catch (error) {
    console.error("❌ Error en cargarDispositivosActivos:", error);
  }
}

// Exponer funciones globales
window.chartjs_togglePause = chartjs_togglePause;
window.chartjs_reiniciarChartJS = chartjs_reiniciarChartJS;
window.chartjs_exportarCSV = chartjs_exportarCSV;

const supabase = window.supabase.createClient(
  'https://hxjmzijhcmhfcrjcptge.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4am16aWpoY21oZmNyamNwdGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwODMxODgsImV4cCI6MjA1NTY1OTE4OH0.fZ1QaYkFTfJTdupOUkV7V9a7kIIVHCt_XusnNWxkyqw'
);

let realtimePaused = false;
const izquierdaTS = new TimeSeries();
const derechaTS = new TimeSeries();
izquierdaTS.maxDataLength = 30;
derechaTS.maxDataLength = 30;

const chart = new SmoothieChart({
  grid: {
    strokeStyle: 'rgba(255,255,255,0.1)',
    millisPerLine: 1000,
    verticalSections: 4
  },
  labels: {
    fillStyle: 'white',
    precision: 2,
    fontSize: 14,
    fontFamily: 'Arial'
  },
  timestampFormatter: date => date.toLocaleTimeString(),
  maxValueScale: 1.2,
  minValueScale: 1.2,

});



// ✅ Renderiza la leyenda de colores
function renderLeyendaPiernas() {
  const leyendaContainer = document.createElement("div");
  leyendaContainer.classList.add("leyenda-piernas");
  leyendaContainer.innerHTML = `
    <div class="item-leyenda">
      <span class="cuadro-color" style="background-color: green;"></span>
      Pierna Izquierda
    </div>
    <div class="item-leyenda">
      <span class="cuadro-color" style="background-color: red;"></span>
      Pierna Derecha
    </div>
  `;
  const chartsContainer = document.querySelector(".charts");
  chartsContainer.insertBefore(leyendaContainer, chartsContainer.children[1]); // Insertar antes de los botones
}

function suscribirseAGraficasRealtime() {
  console.log("🎧 Subscribiéndose a Supabase Realtime...");

  supabase
    .channel('graficas_realtime')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'graficas'
    }, payload => {
      if (realtimePaused) return;

      const data = payload.new;
      const lado = data.lado_pierna_gf;
      // Ajuste visual: convertir a hora local y agregar pequeño delay para que se vea "en presente"
      const utcDate = new Date(data.fecha_hora);

      // Conversión a hora local de CDMX
      const localDate = new Date(utcDate.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));

      // Le agregamos un pequeño margen visual (500 ms) para que no se adelante
      const timestamp = localDate.getTime() + 500;


      const valor = data.aceleracion_y ?? 0;

      console.log("📥 Payload recibido:", payload);
      console.log(`🦿 ${lado} => ${valor} @ ${new Date(timestamp).toLocaleTimeString()}`);

      if (lado === 'izquierda') {
        izquierdaTS.append(timestamp, valor);
        console.log("📈 Dibujando IZQUIERDA", timestamp, valor);
      } else if (lado === 'derecha') {
        derechaTS.append(timestamp, valor);
        console.log("📈 Dibujando DERECHA", timestamp, valor);
      } else {
        console.warn("⚠️ Lado inválido recibido:", lado);
      }
    })
    .subscribe(status => {
      if (status === "SUBSCRIBED") {
        console.log("✅ Canal conectado a Supabase Realtime");
      } else {
        console.warn("⚠️ Estado de conexión:", status);
      }
    });
}

function reiniciarGrafica() {
  izquierdaTS.clear();
  derechaTS.clear();
  mostrarMensaje("🔄 Gráfica reiniciada");
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("grafica_realtime");
  chart.streamTo(canvas, 1000);
  chart.addTimeSeries(izquierdaTS, { strokeStyle: '#00ff00', lineWidth: 2 });
  chart.addTimeSeries(derechaTS, { strokeStyle: '#ff3333', lineWidth: 2 });

  renderLeyendaPiernas();
  document.getElementById("importInput").addEventListener("change", importarCSV);
});


async function togglePause() {
  realtimePaused = !realtimePaused;
  const boton = document.getElementById("pauseButton");
  boton.textContent = realtimePaused ? "Iniciar" : "Pausar";
  mostrarMensaje(realtimePaused ? "⏸️ Pausado" : "▶️ Reanudado");

  try {
    const dispositivos = await fetch("/dispositivos/activos").then(res => res.json());

    for (const dispositivo of dispositivos) {
      const uuid = dispositivo.uuid;
      await fetch(`/dispositivos/permiso_envio/${uuid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: !realtimePaused })
      });
      console.log(`🎮 Permiso de envío actualizado para ${uuid}: ${!realtimePaused}`);
    }
  } catch (err) {
    console.error("❌ Error al actualizar permisos de envío:", err);
    mostrarMensaje("Error al controlar permisos de dispositivos", "error");
  }
}

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

async function exportarGraficaCSV() {
  const ids = JSON.parse(localStorage.getItem("graficas_ids") || "[]");
  if (!ids || ids.length === 0) {
    mostrarMensaje("⚠️ No hay gráficas para exportar", "error");
    return;
  }

  for (const id of ids) {
    try {
      const response = await fetch(`/graficas/exportar_por_id/${id}`);
      if (!response.ok) {
        const err = await response.json();
        console.error("❌ Error exportando gráfica:", err);
        mostrarMensaje(`❌ Error al exportar gráfica ${id}`, "error");
        continue;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grafica_${id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      mostrarMensaje(`✅ Gráfica ${id} exportada`, "success");
    } catch (err) {
      console.error("❌ Error:", err);
      mostrarMensaje("❌ Falló la exportación", "error");
    }
  }
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
  console.log("Preparando POST /esp/configurar_paciente =>", {
    uuid,
    id_paciente,
    id_sesion_dispositivo,
    lado_pierna
  });

  const response = await fetch("/esp/configurar_paciente", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uuid, id_paciente, id_sesion_dispositivo, lado_pierna })
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("❌ Error al enviar config al ESP:", data);
    return;
  }
  console.log("📡 Config enviado al ESP:", data);
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

  dispositivos.forEach(async (dispositivo) => {
    const select = document.createElement("select");
    select.innerHTML = `
      <option value="">Selecciona pierna</option>
      <option value="izquierda" ${dispositivo.pierna === "izquierda" ? "selected" : ""}>Izquierda</option>
      <option value="derecha" ${dispositivo.pierna === "derecha" ? "selected" : ""}>Derecha</option>
    `;

    const estadoSpan = document.createElement("span");
    estadoSpan.className = "estado-envio";
    estadoSpan.textContent = "Cargando...";

    try {
      const permiso = await fetch(`/dispositivos/permiso_envio/${dispositivo.uuid}`).then(r => r.json());
      const activo = permiso.permite;
      estadoSpan.classList.add(activo ? "status-true" : "status-false");
      estadoSpan.textContent = activo ? "Envío activo" : "Pausado";
    } catch (err) {
      console.error("Error al consultar permiso_envio:", err);
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

      mostrarMensaje("Lado actualizado correctamente", "success");
    };

    const row = document.createElement("div");
    row.innerHTML = `<strong>${dispositivo.nombre}</strong>`;
    row.appendChild(select);
    row.appendChild(estadoSpan);
    contenedor.appendChild(row);
  });
}



suscribirseAGraficasRealtime();
cargarDispositivosActivos();
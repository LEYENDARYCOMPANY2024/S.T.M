let smoothie_realtimePaused = true;
let reinicioPendiente = false; // 🔄 Mismo control que en Chart.js
let smoothie_channel = null; // 🔁 Global para poder cerrar el canal anterior
let smoothie_importadosIzquierda = [];
let smoothie_importadosDerecha = [];


const smoothie_izquierdaTS = new TimeSeries();
const smoothie_derechaTS = new TimeSeries();
smoothie_izquierdaTS.maxDataLength = 30;
smoothie_derechaTS.maxDataLength = 30;

const smoothie_chart = new SmoothieChart({
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
  minValueScale: 1.2
});

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("grafica_smoothie");
  smoothie_chart.streamTo(canvas, 0);
  if (!smoothie_realtimePaused) {
    smoothie_chart.start();
  }  
  smoothie_chart.addTimeSeries(smoothie_izquierdaTS, { strokeStyle: '#00ff00', lineWidth: 2 });
  smoothie_chart.addTimeSeries(smoothie_derechaTS, { strokeStyle: '#ff3333', lineWidth: 2 });
  const datosIzq = JSON.parse(localStorage.getItem("smoothie_import_izq") || "[]");
  const datosDer = JSON.parse(localStorage.getItem("smoothie_import_der") || "[]");
  for (const p of datosIzq) smoothie_izquierdaTS.append(p.timestamp, p.value);
  for (const p of datosDer) smoothie_derechaTS.append(p.timestamp, p.value);

  document.getElementById("importInput_smoothie").addEventListener("change", smoothie_importarCSV);

  if (window.tipoGraficaActiva === "smoothie") {
    smoothie_renderLeyenda();
    smoothie_suscribirseRealtime();
    smoothie_cargarDispositivosActivos();
  }
});

function smoothie_renderLeyenda() {
  const leyendaContainer = document.createElement("div");
  leyendaContainer.classList.add("leyenda-piernas");
  leyendaContainer.innerHTML = `
    <div class="item-leyenda">
      <span class="cuadro-color" style="background-color: green;"></span> Pierna Izquierda
    </div>
    <div class="item-leyenda">
      <span class="cuadro-color" style="background-color: red;"></span> Pierna Derecha
    </div>`;
  document.querySelector(".charts").prepend(leyendaContainer);
}



function smoothie_suscribirseRealtime() {
  console.log("🎧 Subscribiendo SMOOTHIE a Supabase Realtime...");

  if (smoothie_channel) {
    supabase.removeChannel(smoothie_channel);
    console.log("🚫 Canal Smoothie anterior cerrado");
  }

  smoothie_channel = supabase
    .channel('grafica_smoothie')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'graficas'
    }, payload => {
      console.log("📡 Evento recibido en Smoothie");

      if (smoothie_realtimePaused) {
        console.warn("⏸️ Smoothie pausado, no procesa datos.");
        return;
      }

      const data = payload.new;
      const lado = data.lado_pierna_gf;
      const valor = data.aceleracion_y ?? 0;
      const timestamp = new Date(data.fecha_hora).getTime();

      if (!lado || !["izquierda", "derecha"].includes(lado)) {
        console.warn("⚠️ Lado inválido:", lado);
        return;
      }

      if (lado === 'izquierda') {
        smoothie_izquierdaTS.append(timestamp, valor);
        smoothie_importadosIzquierda.push({ timestamp, value: valor });
      
        // ✅ Mantener solo los últimos 30
        if (smoothie_importadosIzquierda.length > 30) {
          smoothie_importadosIzquierda.shift();
        }
      
        localStorage.setItem("smoothie_import_izq", JSON.stringify(smoothie_importadosIzquierda));
      } else {
        smoothie_derechaTS.append(timestamp, valor);
        smoothie_importadosDerecha.push({ timestamp, value: valor });
      
        if (smoothie_importadosDerecha.length > 30) {
          smoothie_importadosDerecha.shift();
        }
      
        localStorage.setItem("smoothie_import_der", JSON.stringify(smoothie_importadosDerecha));
      }
      

      console.log(`✅ SMOOTHIE - ${lado} => ${valor} @ ${new Date(timestamp).toLocaleTimeString()}`);
    })
    .subscribe(s => {
      if (s === 'SUBSCRIBED') {
        console.log("✅ Smoothie conectado a Realtime");
      }
    });
}



window.smoothie_togglePause = async function () {
  smoothie_realtimePaused = !smoothie_realtimePaused;

  // 🟢 Control visual de la gráfica
  if (smoothie_realtimePaused) {
    smoothie_chart.stop(); // ⛔ Detiene el desplazamiento visual
  } else {
    smoothie_chart.start(); // ▶️ Lo reactiva
  }

  const boton = document.getElementById("pauseButton");
  boton.textContent = smoothie_realtimePaused ? "Iniciar" : "Pausar";
  smoothie_mostrarMensaje(smoothie_realtimePaused ? "Pausado" : "Reanudado");

  if (!smoothie_realtimePaused) reinicioPendiente = true;

  // 🧠 Enviar cambio de estado a los dispositivos activos
  try {
    const dispositivos = await fetch("/dispositivos/activos").then(res => res.json());
    for (const dispositivo of dispositivos) {
      await fetch(`/dispositivos/permiso_envio/${dispositivo.uuid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: !smoothie_realtimePaused })
      });
    }
  } catch (err) {
    smoothie_mostrarMensaje("❌ Error controlando dispositivos", "error");
  }
};


function smoothie_exportarCSV() {
  const filas = [["timestamp", "izquierda_ay", "derecha_ay"]];
  const largo = Math.max(smoothie_izquierdaTS.data.length, smoothie_derechaTS.data.length);

  for (let i = 0; i < largo; i++) {
    const ts = smoothie_izquierdaTS.data[i]?.timestamp || smoothie_derechaTS.data[i]?.timestamp || "";
    const izquierda = smoothie_izquierdaTS.data[i]?.value ?? "";
    const derecha = smoothie_derechaTS.data[i]?.value ?? "";
    const hora = ts ? new Date(ts).toLocaleTimeString() : "";
    filas.push([hora, izquierda, derecha]);
  }

  const csv = filas.map(f => f.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "grafica_smoothie.csv";
  a.click();
  a.remove();
}
window.smoothie_exportarCSV = smoothie_exportarCSV;

async function smoothie_importarCSV(event) {
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
      smoothie_mostrarMensaje("⚠️ El CSV debe tener columnas: hora, izquierda_ay, derecha_ay", "error");
      return;
    }

    // 🔁 Limpiar gráfica y pausar realtime
    smoothie_izquierdaTS.clear();
    smoothie_derechaTS.clear();
    smoothie_realtimePaused = true;
    smoothie_chart.stop(); // ⛔ DETENER MOVIMIENTO VISUAL
    document.getElementById("pauseButton").textContent = "Iniciar";

    // ⛔ Detener envío real
    try {
      const dispositivos = await fetch("/dispositivos/activos").then(res => res.json());
      for (const dispositivo of dispositivos) {
        await fetch(`/dispositivos/permiso_envio/${dispositivo.uuid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: false })
        });
      }
    } catch (err) {
      console.error("❌ Error al pausar envío desde el ESP:", err);
    }

    // 🧠 Limpiar arrays de datos anteriores
    smoothie_importadosIzquierda = [];
    smoothie_importadosDerecha = [];

    const ahora = Date.now(); // 🔄 Timestamp base: ahora

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const columnas = fila.split(",");

    const offset = i * 1000; // 1 segundo entre cada punto (puedes ajustar)
    const ts = ahora + offset; // 🕒 Timestamp simulado actual

    const izq = parseFloat(columnas[idxIzq]) || 0;
    const der = parseFloat(columnas[idxDer]) || 0;

    smoothie_importadosIzquierda.push({ timestamp: ts, value: izq });
    smoothie_importadosDerecha.push({ timestamp: ts, value: der });

    smoothie_izquierdaTS.append(ts, izq);
    smoothie_derechaTS.append(ts, der);
  }

  };

  localStorage.setItem("smoothie_import_izq", JSON.stringify(smoothie_importadosIzquierda));
  localStorage.setItem("smoothie_import_der", JSON.stringify(smoothie_importadosDerecha));

  reader.readAsText(file);
  // 👇 Limpiar el input para permitir importar el mismo archivo otra vez
  event.target.value = "";

}


function smoothie_mostrarMensaje(msg, tipo = "success") {
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

async function smoothie_enviarDatosAlESP(uuid, id_paciente, id_sesion_dispositivo, lado_pierna) {
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

async function smoothie_cargarDispositivosActivos() {
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
        await smoothie_enviarDatosAlESP(uuid, parseInt(id_paciente), dispositivo.id, nuevoLado);
      }

      smoothie_mostrarMensaje("Lado actualizado correctamente", "success");
    };

    const row = document.createElement("div");
    row.innerHTML = `<strong>${dispositivo.nombre}</strong>`;
    row.appendChild(select);
    row.appendChild(estadoSpan);
    contenedor.appendChild(row);
  });
}

window.smoothie_reiniciarGrafica = function () {
  // Mostrar confirmación antes de reiniciar
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal-confirm";

  modal.innerHTML = `
    <h2>¿Reiniciar la gráfica?</h2>
    <p>⚠️ Esto eliminará los datos obtenidos e importados.<br>💾 Guarda tus datos antes de reiniciar.<br>¿Estás seguro de continuar?</p>
    <div class="modal-buttons">
      <button class="btn-secondary" id="cancelarReinicio">Cancelar</button>
      <button class="btn-danger" id="confirmarReinicio">Reiniciar</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById("cancelarReinicio").onclick = () => overlay.remove();

  document.getElementById("confirmarReinicio").onclick = async () => {
    overlay.remove();

    smoothie_izquierdaTS.clear();
    smoothie_derechaTS.clear();
    smoothie_importadosIzquierda = [];
    smoothie_importadosDerecha = [];

    smoothie_realtimePaused = false; // ✅ Reactivar tiempo real
    smoothie_chart.start(); // ▶️ Reactiva la animación visual
    reinicioPendiente = false;
    document.getElementById("pauseButton").textContent = "Pausar";

    smoothie_mostrarMensaje("Gráfica reiniciada y datos eliminados");

    // 🧠 Reactivar envío de datos desde el ESP
    try {
      const dispositivos = await fetch("/dispositivos/activos").then(res => res.json());
      for (const dispositivo of dispositivos) {
        await fetch(`/dispositivos/permiso_envio/${dispositivo.uuid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: true }) // 🟢 Reactivar envío
        });
      }
    } catch (err) {
      console.error("❌ Error reactivando envío desde el ESP:", err);
      smoothie_mostrarMensaje("❌ Error al reactivar envío en ESP", "error");
    }
  };
};


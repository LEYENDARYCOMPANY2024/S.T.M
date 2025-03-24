const supabase = window.supabase.createClient(
    'https://hxjmzijhcmhfcrjcptge.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4am16aWpoY21oZmNyamNwdGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwODMxODgsImV4cCI6MjA1NTY1OTE4OH0.fZ1QaYkFTfJTdupOUkV7V9a7kIIVHCt_XusnNWxkyqw'
  );
  
  let chartData = {
    labels: [],
    datasets: {
      izquierda: { ay: [] },
      derecha: { ay: [] }
    }
  };
  
  let chart = null;
  let realtimePaused = false;
  const MAX_DATA_POINTS = 30;
  
  document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById("grafica_realtime").getContext("2d");
  
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: "Pierna Izquierda",
            borderColor: "green",
            data: chartData.datasets.izquierda.ay,
            fill: false
          },
          {
            label: "Pierna Derecha",
            borderColor: "red",
            data: chartData.datasets.derecha.ay,
            fill: false
          }
        ]
      },
      options: {
        animation: false,
        responsive: true,
        elements: {
          line: {
            tension: 0 // ✅ Mejora rendimiento visual quitando suavizado
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Aceleración Y'
            }
          },
          x: {
            display: true,
            title: {
              display: true,
              text: 'Hora'
            }
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
  
    renderLeyendaPiernas();
    document.getElementById("importInput").addEventListener("change", importarCSV);
  });
  
  function renderLeyendaPiernas() {
    const contenedor = document.createElement("div");
    contenedor.classList.add("leyenda-piernas");
  
    contenedor.innerHTML = `
      <div class="item-leyenda">
        <span class="cuadro-color" style="background-color: green;"></span>
        Pierna Izquierda
      </div>
      <div class="item-leyenda">
        <span class="cuadro-color" style="background-color: red;"></span>
        Pierna Derecha
      </div>
    `;
  
    document.querySelector(".charts").prepend(contenedor);
  }
  
  function limitData() {
    if (chartData.labels.length > MAX_DATA_POINTS) {
      chartData.labels.shift();
      Object.values(chartData.datasets).forEach(dataset => {
        dataset.ay.shift();
      });
    }
  }
  
  function suscribirseAGraficasRealtime() {
    console.log("🎧 Subscribiéndose a Supabase Realtime...");
  
    supabase
      .channel('graficas_realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'graficas'
      }, payload => {
        if (realtimePaused) return;
  
        const data = payload.new;
  
        // ✅ Solo extraemos lo necesario
        const { id_grafica, fecha_hora, lado_pierna_gf, aceleracion_y } = data;
  
        if (!lado_pierna_gf || aceleracion_y === undefined) {
          console.warn("⚠️ Datos incompletos recibidos");
          return;
        }
  
        const t = new Date(fecha_hora).toLocaleTimeString();
        chart.data.labels.push(t);
  
        const datasetLabel = lado_pierna_gf === "izquierda" ? "Pierna Izquierda" : "Pierna Derecha";
        const dataset = chart.data.datasets.find(ds => ds.label === datasetLabel);
  
        if (dataset) {
          dataset.data.push(aceleracion_y);
        }
  
        // ⛔ No usamos más campos como aceleracion_x, rotaciones, etc.
  
        // Limitar puntos para mantener rendimiento
        if (chart.data.labels.length > MAX_DATA_POINTS) {
          chart.data.labels.shift();
          chart.data.datasets.forEach(ds => ds.data.shift());
        }
  
        chart.update('none');  // ⚡ Ligero
        console.log(`✅ Gráfica actualizada (${lado_pierna_gf})`);
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
    chartData.labels = [];
    Object.values(chartData.datasets).forEach(dataset => {
      dataset.ay = [];
    });
    chart.update();
    mostrarMensaje("🔄 Gráfica reiniciada");
  }
  
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
    // Verifica en la consola que no sean undefined ni null
    console.log("Preparando POST /esp/configurar_paciente =>", {
      uuid,
      id_paciente,
      id_sesion_dispositivo,
      lado_pierna
    });
  
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
  
      // 🟢 Estado de permiso visual
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
      row.appendChild(estadoSpan);  // ✅ Añadimos visualmente
      contenedor.appendChild(row);
  });
  
}

suscribirseAGraficasRealtime();
cargarDispositivosActivos();

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

        if (sesion.finalizada) {
            mostrarMensaje("🔒 Esta sesión ya fue finalizada. No se permiten cambios.", "error");
          
            // Desactivar todos los botones, inputs, selects
            document.querySelectorAll("button, input, select").forEach(el => el.disabled = true);
            document.querySelectorAll("textarea").forEach(el => el.readOnly = true);
          
            // También puedes ocultar los botones de exportar, importar, guardar o reiniciar gráfica
            const botonesOcultar = [
              "exportButton", "importButton", "reiniciarButton", "finalizarSesion"
            ];
            botonesOcultar.forEach(id => {
              const btn = document.getElementById(id);
              if (btn) btn.style.display = "none";
            });
          }          

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

        // 📌 *Evento para actualizar la descripción*
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
            const overlay = document.createElement("div");
            overlay.className = "modal-overlay";

            const modal = document.createElement("div");
            modal.className = "modal-confirm";

            modal.innerHTML = `
            <h2>¿Salir del detalle de sesión?</h2>
            <p>⚠ Esto eliminará los datos en tiempo real e importados de esta sesión.<br>
            💾 Se recomienda <strong>guardar tu gráfica</strong> antes de salir.</p>
            <div class="modal-buttons">
                <button class="btn-secondary" id="cancelarSalir">Cancelar</button>
                <button class="btn-danger" id="confirmarSalir">Salir</button>
            </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            document.getElementById("cancelarSalir").onclick = () => {
            overlay.remove();
            };

            document.getElementById("confirmarSalir").onclick = async () => {
            const sesionId = localStorage.getItem("id_sesion");

            if (sesionId) {
                try {
                await fetch(`/dispositivos/desactivar/${sesionId}`, {
                    method: "PUT"
                });
                console.log("🔌 Dispositivos desactivados al salir de la sesión.");
                } catch (error) {
                console.error("❌ Error al desactivar dispositivos:", error);
                }
            }

            // 🧹 Eliminar datos de sesión y gráficas
            localStorage.removeItem("id_sesion");
            localStorage.removeItem("nombre_sesion");
            localStorage.removeItem("sesion_dispositivo_ids");
            localStorage.removeItem("graficas_ids");

            // 🧹 También los datos de Smoothie si existen
            localStorage.removeItem("smoothie_import_izq");
            localStorage.removeItem("smoothie_import_der");

            // 🧹 Y los datos de Chart.js
            localStorage.removeItem("chartjs_import_izq");
            localStorage.removeItem("chartjs_import_der");


            window.location.href = "/sesiones";
            };
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

      
    



// Añadir filtro de rango de visibilidad para mejorar la precisión de la detección
function addVisibilityThresholdControl() {
    // Crear el control deslizador
    const controlContainer = document.createElement('div');
    controlContainer.className = 'control-group';
    
    const label = document.createElement('label');
    label.textContent = 'Umbral de visibilidad: ';
    
    const visibilitySlider = document.createElement('input');
    visibilitySlider.type = 'range';
    visibilitySlider.min = '0';
    visibilitySlider.max = '100';
    visibilitySlider.value = '50'; // Valor predeterminado: 0.5 de visibilidad
    visibilitySlider.id = 'visibilitySlider';
    
    const visibilityValue = document.createElement('span');
    visibilityValue.textContent = '0.5';
    visibilityValue.id = 'visibilityValue';
    
    // Actualizar el valor cuando se mueva el slider
    visibilitySlider.addEventListener('input', function() {
        const value = parseInt(this.value) / 100;
        visibilityValue.textContent = value.toFixed(2);
        
        // Actualizar el umbral de visibilidad en todas las funciones relevantes
        window.visibilityThreshold = value;
        
        // Redibujar el frame actual
        drawCurrentFrame();
        
        // Actualizar la tabla
        displayPoseData(currentFrame);
    });
    
    controlContainer.appendChild(label);
    controlContainer.appendChild(visibilitySlider);
    controlContainer.appendChild(visibilityValue);
    
    // Insertar el control en el DOM (justo después de pointSizeSlider)
    const pointSizeContainer = pointSizeSlider.parentNode;
    pointSizeContainer.parentNode.insertBefore(controlContainer, pointSizeContainer.nextSibling);
    
    // Inicializar la variable global
    window.visibilityThreshold = 0.5;
}

// Llamar a esta función al inicio
addVisibilityThresholdControl();

// Actualizar la función findHoveredPoint para usar el umbral de visibilidad
function findHoveredPoint() {
    if (!poseDataFrames[currentFrame]) return null;
    
    const frameData = poseDataFrames[currentFrame];
    const hoverRadius = pointSize + 5; // Área de detección un poco mayor que el punto
    const threshold = window.visibilityThreshold || 0.5;
    
    // Ordenar los puntos por distancia al cursor
    const sortedPoints = frameData
        .filter(point => point.visibility > threshold)
        .map(point => {
            const dx = point.x - mouseX;
            const dy = point.y - mouseY;
            const distance = Math.sqrt(dx*dx + dy*dy);
            return { ...point, distance };
        })
        .sort((a, b) => a.distance - b.distance);
    
    // Devolver el punto más cercano si está dentro del radio de hover
    if (sortedPoints.length > 0 && sortedPoints[0].distance <= hoverRadius) {
        return sortedPoints[0];
    }
    
    return null;
}

// Añadir función para resaltar puntos relacionados al hacer hover
function highlightRelatedPoints(pointIndex) {
    if (!poseDataFrames[currentFrame]) return;
    
    // Encontrar todas las conexiones que incluyen este punto
    const relatedPoints = new Set();
    relatedPoints.add(parseInt(pointIndex));
    
    POSE_CONNECTIONS.forEach(connection => {
        if (connection[0] === parseInt(pointIndex)) {
            relatedPoints.add(connection[1]);
        } else if (connection[1] === parseInt(pointIndex)) {
            relatedPoints.add(connection[0]);
        }
    });
    
    // Redibujar el frame resaltando los puntos relacionados
    const frameData = poseDataFrames[currentFrame];
    
    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Dibujar primero las conexiones
    if (showConnections.checked) {
        drawFrameConnections(frameData);
        
        // Resaltar conexiones relacionadas
        ctx.strokeStyle = '#FFFF00'; // Amarillo brillante
        ctx.lineWidth = 3;
        
        const pointMap = {};
        frameData.forEach(point => {
            pointMap[point.point] = point;
        });
        
        POSE_CONNECTIONS.forEach(connection => {
            if (relatedPoints.has(connection[0]) && relatedPoints.has(connection[1])) {
                const fromPoint = pointMap[connection[0]];
                const toPoint = pointMap[connection[1]];
                
                if (fromPoint && toPoint && fromPoint.visibility > 0.5 && toPoint.visibility > 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(fromPoint.x, fromPoint.y);
                    ctx.lineTo(toPoint.x, toPoint.y);
                    ctx.stroke();
                }
            }
        });
    }
    
    // Dibujar los puntos
    frameData.forEach(point => {
        // Verificar si el grupo del punto está filtrado
        const pointGroup = pointToGroup[point.point];
        if (filteredGroups.length > 0 && !filteredGroups.includes(pointGroup)) {
            return;
        }
        
        // Solo dibujar si es visible
        if (point.visibility > 0.5) {
            // Determinar si es un punto relacionado
            const isRelated = relatedPoints.has(point.point);
            const isHighlighted = point.point === parseInt(pointIndex);
            
            // Dibujar círculo del punto
            ctx.beginPath();
            ctx.arc(point.x, point.y, isRelated ? pointSize * 1.5 : pointSize, 0, 2 * Math.PI);
            
            if (isHighlighted) {
                ctx.fillStyle = '#FFFFFF'; // Blanco para el punto principal
            } else if (isRelated) {
                ctx.fillStyle = '#FFFF00'; // Amarillo para puntos relacionados
            } else {
                ctx.fillStyle = point.color;
            }
            
            ctx.fill();
            ctx.strokeStyle = isHighlighted ? '#000000' : (isRelated ? '#FF0000' : '#000000');
            ctx.lineWidth = isHighlighted || isRelated ? 2 : 1;
            ctx.stroke();
            
            // Dibujar etiqueta si está habilitado
            if (showLabels.checked || isHighlighted) {
                // Calcular posición de la etiqueta
                const labelX = point.x + pointSize + 5;
                const labelY = point.y;
                
                // Crear fondo para la etiqueta
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                const pointName = point.point.toString();
                const textWidth = ctx.measureText(pointName).width + 10;
                const textHeight = 20;
                ctx.fillRect(labelX - 5, labelY - 10, textWidth, textHeight);
                
                // Añadir texto de la etiqueta
                ctx.fillStyle = '#000000';
                ctx.font = isHighlighted ? 'bold 14px Arial' : 'bold 12px Arial';
                ctx.fillText(pointName, labelX, labelY);
            }
        }
    });
    
    ctx.restore();
}

// Añadir evento para detectar clic en la tabla
tableBody.addEventListener('mouseover', function(event) {
    const row = event.target.closest('tr');
    if (row) {
        const pointIndex = row.querySelector('td:first-child').textContent;
        highlightRelatedPoints(pointIndex);
        
        // Resaltar la fila
        row.style.backgroundColor = '#FFFFCC';
    }
});

tableBody.addEventListener('mouseout', function(event) {
    const row = event.target.closest('tr');
    if (row) {
        drawCurrentFrame(); // Volver al dibujo normal
        
        // Quitar resaltado de la fila
        row.style.backgroundColor = '';
    }
});






document.addEventListener("DOMContentLoaded", () => {
    const irInicioBtn = document.querySelector(".home-button");

    if (irInicioBtn) {
      irInicioBtn.addEventListener("click", (e) => {
        e.preventDefault();

        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";

        const modal = document.createElement("div");
        modal.className = "modal-confirm";

        modal.innerHTML = `
          <h2>¿Ir al inicio?</h2>
          <p>⚠ Si vuelves al inicio, <strong>se eliminarán los datos de las gráficas importadas o en tiempo real</strong>.<br>
          💾 Te recomendamos <strong>guardar tu gráfica</strong> antes de continuar.</p>
          <div class="modal-buttons">
            <button class="btn-secondary" id="cancelarInicio">Cancelar</button>
            <button class="btn-danger" id="confirmarInicio">Ir al inicio</button>
          </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById("cancelarInicio").onclick = () => {
          overlay.remove();
        };

        document.getElementById("confirmarInicio").onclick = async () => {
          const sesionId = localStorage.getItem("id_sesion");

          if (sesionId) {
            try {
              await fetch(`/dispositivos/desactivar/${sesionId}`, { method: "PUT" });
              console.log("🔌 Dispositivos desactivados al ir al inicio.");
            } catch (error) {
              console.error("❌ Error al desactivar dispositivos:", error);
            }
          }

          // 🧹 Eliminar todo lo relacionado a gráficas
          localStorage.removeItem("id_sesion");
          localStorage.removeItem("nombre_sesion");
          localStorage.removeItem("sesion_dispositivo_ids");
          localStorage.removeItem("graficas_ids");

          // 🧹 Eliminar respaldo de datos importados o en tiempo real (Smoothie)
          localStorage.removeItem("smoothie_import_izq");
          localStorage.removeItem("smoothie_import_der");

          // 🧹 Y los datos de Chart.js
          localStorage.removeItem("chartjs_import_izq");
          localStorage.removeItem("chartjs_import_der");

          window.location.href = "/principal";
        };
      });
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const finalizarBtn = document.getElementById("finalizarSesion");
  
    if (finalizarBtn) {
      finalizarBtn.addEventListener("click", () => {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
  
        const modal = document.createElement("div");
        modal.className = "modal-confirm";
  
        modal.innerHTML = `
          <h2>¿Finalizar sesión?</h2>
          <p>⚠ Esto <strong>enviará los datos finales al paciente de la gráfica y tabla</strong>.<br>
          🔒 Después de esto, <strong>ya no podrás hacer modificaciones</strong> en esta sesión.<br>
          ¿Deseas continuar?</p>
          <div class="modal-buttons">
            <button class="btn-secondary" id="cancelarFinalizar">Cancelar</button>
            <button class="btn-danger" id="confirmarFinalizar">Finalizar</button>
          </div>
        `;
  
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
  
        document.getElementById("cancelarFinalizar").onclick = () => {
          overlay.remove();
        };
  
        document.getElementById("confirmarFinalizar").onclick = async () => {
          overlay.remove();
  
          const idSesion = localStorage.getItem("id_sesion");
          if (!idSesion) {
            mostrarMensaje("❌ No se encontró la sesión activa", "error");
            return;
          }
  
          let datosGrafica = null;
  
          if (window.tipoGraficaActiva === "chartjs") {
            datosGrafica = {
              izquierda: JSON.parse(localStorage.getItem("chartjs_import_izq") || "[]"),
              derecha: JSON.parse(localStorage.getItem("chartjs_import_der") || "[]")
            };
          } else if (window.tipoGraficaActiva === "smoothie") {
            datosGrafica = {
              izquierda: JSON.parse(localStorage.getItem("smoothie_import_izq") || "[]"),
              derecha: JSON.parse(localStorage.getItem("smoothie_import_der") || "[]")
            };
          }
  
          // 🔵 También puedes extraer datos de MediaPipe si ya los guardas
          let datosMediapipe = [];

            try {
            const stored = localStorage.getItem("tabla_mediapipe");
            const parsed = JSON.parse(stored);

            if (Array.isArray(parsed)) {
                datosMediapipe = parsed;
            } else {
                console.warn("⚠️ MediaPipe no es un array, usando [] por defecto");
            }
            } catch (e) {
            console.warn("⚠️ Error parseando tabla_mediapipe, usando [] por defecto");
            }

  
          try {
            const response = await fetch("/graficas_movil", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id_sesion_fk: parseInt(idSesion),
                datos_graficas: datosGrafica,
                datos_mediapipe: datosMediapipe
              })
            });
  
            if (!response.ok) throw new Error("❌ Error al guardar en el backend");
  
            mostrarMensaje("✅ Sesión finalizada y datos enviados");
  
            // 🛑 Opcional: desactiva todos los inputs, botones y controles
            document.querySelectorAll("button, input, select").forEach(el => el.disabled = true);
            document.querySelectorAll("textarea").forEach(el => el.readOnly = true);

            localStorage.removeItem("tabla_mediapipe");

  
          } catch (error) {
            console.error(error);
            mostrarMensaje("❌ Error al finalizar sesión", "error");
          }
        };
      });
    }
  });
  
  

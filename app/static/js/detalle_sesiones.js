
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

        // 📌 **Evento para actualizar la descripción**
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
            <p>⚠️ Esto eliminará los datos en tiempo real e importados de esta sesión.<br>
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



   // Elementos del DOM
   const videoElement = document.getElementById('videoElement');
   const canvasElement = document.getElementById('canvasElement');
   const recordedVideo = document.getElementById('recordedVideo');
   const ctx = canvasElement.getContext('2d');
   const startButton = document.getElementById('startButton');
   const recordButton = document.getElementById('recordButton');
   const stopButton = document.getElementById('stopButton');
   const processButton = document.getElementById('processButton');
   const playPauseButton = document.getElementById('playPauseButton');
   const statusText = document.getElementById('status');
   const speedSlider = document.getElementById('speedSlider');
   const speedValue = document.getElementById('speedValue');
   const pointSizeSlider = document.getElementById('pointSizeSlider');
   const pointSizeValue = document.getElementById('pointSizeValue');
   const frameSlider = document.getElementById('frameSlider');
   const frameValue = document.getElementById('frameValue');
   const totalFrameValue = document.getElementById('totalFrameValue');
   const tableBody = document.getElementById('tableBody');
   const exportButton = document.getElementById('exportButton');
   const showLabels = document.getElementById('showLabels');
   const showConnections = document.getElementById('showConnections');
   const showHoverInfo = document.getElementById('showHoverInfo');
   const colorLegend = document.getElementById('colorLegend');
   const groupFilter = document.getElementById('groupFilter');
   const pointInfo = document.getElementById('pointInfo');
   const tableFilter = document.getElementById('tableFilter');
   
   // Variables
   let stream = null;
   let mediaRecorder = null;
   let recordedChunks = [];
   let recordedBlob = null;
   let isProcessing = false;
   let isPaused = false;
   let currentFrame = 0;
   let totalFrames = 0;
   let pose = null;
   let processingSpeed = 3;
   let pointSize = 6;
   let filteredGroups = [];
   let mouseX = 0;
   let mouseY = 0;
   
   // Array para almacenar los datos de los puntos de pose para cada frame
   let poseDataFrames = [];
   
   // Colores para dibujar las líneas
   const lineColor = 'rgba(102, 102, 102, 0.7)';
   
   // Definir nombres de puntos clave
   const pointNames = {
       0: "Nariz",
       1: "Ojo izquierdo (interior)",
       2: "Ojo izquierdo",
       3: "Ojo izquierdo (exterior)",
       4: "Ojo derecho (interior)",
       5: "Ojo derecho",
       6: "Ojo derecho (exterior)",
       7: "Oreja izquierda",
       8: "Oreja derecha",
       9: "Boca (izquierda)",
       10: "Boca (derecha)",
       11: "Hombro izquierdo",
       12: "Hombro derecho",
       13: "Codo izquierdo",
       14: "Codo derecho",
       15: "Muñeca izquierda",
       16: "Muñeca derecha",
       17: "Pulgar izquierdo",
       18: "Pulgar derecho",
       19: "Índice izquierdo",
       20: "Índice derecho",
       21: "Meñique izquierdo",
       22: "Meñique derecho",
       23: "Cadera izquierda",
       24: "Cadera derecha",
       25: "Rodilla izquierda",
       26: "Rodilla derecha",
       27: "Tobillo izquierdo",
       28: "Tobillo derecho",
       29: "Talón izquierdo",
       30: "Talón derecho",
       31: "Índice pie izquierdo",
       32: "Índice pie derecho"
   };
   
   // Definir grupos de colores para diferentes partes del cuerpo
   const pointGroups = [
       { name: "Cara", points: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], color: "#FF0000" },
       { name: "Torso", points: [11, 12, 23, 24], color: "#00FF00" },
       { name: "Brazo Izquierdo", points: [11, 13, 15, 17, 19, 21], color: "#0000FF" },
       { name: "Brazo Derecho", points: [12, 14, 16, 18, 20, 22], color: "#FFFF00" },
       { name: "Pierna Izquierda", points: [23, 25, 27, 29, 31], color: "#FF00FF" },
       { name: "Pierna Derecha", points: [24, 26, 28, 30, 32], color: "#00FFFF" }
   ];
   
   // Crear mapa de colores para cada punto
   const pointColors = {};
   const pointToGroup = {};
   
   pointGroups.forEach(group => {
       group.points.forEach(point => {
           pointColors[point] = group.color;
           pointToGroup[point] = group.name;
       });
   });
   
   // Generar leyenda de colores
   function generateColorLegend() {
       colorLegend.innerHTML = '';
       pointGroups.forEach(group => {
           const legendItem = document.createElement('div');
           legendItem.className = 'legend-item';
           
           const colorBox = document.createElement('div');
           colorBox.className = 'color-box';
           colorBox.style.backgroundColor = group.color;
           
           const label = document.createElement('span');
           label.textContent = group.name;
           
           legendItem.appendChild(colorBox);
           legendItem.appendChild(label);
           colorLegend.appendChild(legendItem);
       });
   }
   
   // Generar botones de filtro por grupo
   function generateGroupFilters() {
       // Botón para todos los grupos
       const allButton = document.createElement('button');
       allButton.textContent = 'Todos';
       allButton.className = 'group-button active';
       allButton.style.backgroundColor = '#555';
       allButton.style.color = 'white';
       allButton.onclick = () => {
           filteredGroups = [];
           updateGroupFilterButtons();
           drawCurrentFrame();
       };
       groupFilter.appendChild(allButton);
       
       // Botón para cada grupo
       pointGroups.forEach(group => {
           const button = document.createElement('button');
           button.textContent = group.name;
           button.className = 'group-button';
           button.style.backgroundColor = group.color;
           button.style.color = getContrastColor(group.color);
           button.onclick = () => {
               const index = filteredGroups.indexOf(group.name);
               if (index > -1) {
                   filteredGroups.splice(index, 1);
               } else {
                   filteredGroups.push(group.name);
               }
               updateGroupFilterButtons();
               drawCurrentFrame();
           };
           groupFilter.appendChild(button);
       });
   }
   
   // Función para obtener color de texto con buen contraste
   function getContrastColor(hexColor) {
       // Convertir hex a RGB
       const r = parseInt(hexColor.slice(1, 3), 16);
       const g = parseInt(hexColor.slice(3, 5), 16);
       const b = parseInt(hexColor.slice(5, 7), 16);
       
       // Calcular luminosidad
       const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
       
       // Devolver blanco o negro según la luminosidad
       return luminance > 0.5 ? '#000000' : '#FFFFFF';
   }
   
   // Actualizar la apariencia de los botones de filtro
   function updateGroupFilterButtons() {
       const buttons = groupFilter.querySelectorAll('.group-button');
       
       // El primer botón siempre es "Todos"
       buttons[0].classList.toggle('active', filteredGroups.length === 0);
       
       // Resto de botones son grupos específicos
       for (let i = 1; i < buttons.length; i++) {
           const groupName = pointGroups[i-1].name;
           buttons[i].classList.toggle('active', filteredGroups.includes(groupName));
       }
   }
   
   // Generar la leyenda y filtros al cargar la página
   generateColorLegend();
   generateGroupFilters();
   
   // Actualizar el valor de velocidad cuando se mueva el slider
   speedSlider.addEventListener('input', function() {
       processingSpeed = parseInt(this.value);
       speedValue.textContent = processingSpeed;
   });
   
   // Actualizar el tamaño de los puntos cuando se mueva el slider
   pointSizeSlider.addEventListener('input', function() {
       pointSize = parseInt(this.value);
       pointSizeValue.textContent = pointSize;
       drawCurrentFrame();
   });
   
   // Actualizar los datos mostrados cuando se seleccione un frame diferente
   frameSlider.addEventListener('input', function() {
       const selectedFrame = parseInt(this.value);
       frameValue.textContent = selectedFrame;
       currentFrame = selectedFrame;
       drawCurrentFrame();
       displayPoseData(selectedFrame);
   });
   
   // Filtrar la tabla según el texto ingresado
   tableFilter.addEventListener('input', function() {
       const filterText = this.value.toLowerCase();
       const rows = tableBody.querySelectorAll('tr');
       
       rows.forEach(row => {
           const point = row.querySelector('td:first-child').textContent;
           const group = row.querySelector('td:nth-child(2)').textContent;
           const pointName = pointNames[point] || '';
           
           if (
               point.toLowerCase().includes(filterText) || 
               group.toLowerCase().includes(filterText) ||
               pointName.toLowerCase().includes(filterText)
           ) {
               row.style.display = '';
           } else {
               row.style.display = 'none';
           }
       });
   });
   
   // Rastrear posición del mouse para mostrar información de puntos
   canvasElement.addEventListener('mousemove', function(event) {
       const rect = canvasElement.getBoundingClientRect();
       mouseX = event.clientX - rect.left;
       mouseY = event.clientY - rect.top;
       
       if (showHoverInfo.checked && poseDataFrames[currentFrame]) {
           const hoveredPoint = findHoveredPoint();
           
           if (hoveredPoint) {
               pointInfo.style.display = 'block';
               pointInfo.style.left = `${event.clientX + 10}px`;
               pointInfo.style.top = `${event.clientY + 10}px`;
               
               const pointName = pointNames[hoveredPoint.point] || `Punto ${hoveredPoint.point}`;
               
               pointInfo.innerHTML = `
                   <strong>${pointName}</strong><br>
                   Grupo: ${pointToGroup[hoveredPoint.point]}<br>
                   X: ${hoveredPoint.x}, Y: ${hoveredPoint.y}<br>
                   Visibilidad: ${hoveredPoint.visibility}
               `;
           } else {
               pointInfo.style.display = 'none';
           }
       } else {
           pointInfo.style.display = 'none';
       }
   });
   
   canvasElement.addEventListener('mouseleave', function() {
       pointInfo.style.display = 'none';
   });
   
   // Encontrar el punto sobre el que está el cursor
   function findHoveredPoint() {
       if (!poseDataFrames[currentFrame]) return null;
       
       const frameData = poseDataFrames[currentFrame];
       const hoverRadius = pointSize + 5; // Área de detección un poco mayor que el punto
       
       for (const point of frameData) {
           const dx = point.x - mouseX;
           const dy = point.y - mouseY;
           const distance = Math.sqrt(dx*dx + dy*dy);
           
           if (distance <= hoverRadius && point.visibility > 0.5) {
               return point;
           }
       }
       
       return null;
   }
   
   // Inicializar MediaPipe Pose
   function initPose() {
       pose = new Pose({
           locateFile: (file) => {
               return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
           }
       });
       
       pose.setOptions({
           modelComplexity: 1,
           smoothLandmarks: true,
           enableSegmentation: false,
           smoothSegmentation: false,
           minDetectionConfidence: 0.5,
           minTrackingConfidence: 0.5
       });
       
       pose.onResults(onPoseResults);
       
       statusText.textContent = "MediaPipe inicializado";
   }
   
   // Obtener color para un punto específico
   function getPointColor(pointIndex) {
       return pointColors[pointIndex] || "#FFFFFF";
   }
   
   // Dibujar el frame actual
   function drawCurrentFrame() {
       ctx.save();
       ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
       
       if (currentFrame >= poseDataFrames.length || !poseDataFrames[currentFrame]) {
           ctx.restore();
           return;
       }
       
       const frameData = poseDataFrames[currentFrame];
       
       // Dibujar conexiones si está habilitado
       if (showConnections.checked) {
           drawFrameConnections(frameData);
       }
       
       // Dibujar puntos
       frameData.forEach(point => {
           // Verificar si el grupo del punto está filtrado
           const pointGroup = pointToGroup[point.point];
           if (filteredGroups.length > 0 && !filteredGroups.includes(pointGroup)) {
               return;
           }
           
           // Solo dibujar si es visible
           if (point.visibility > 0.5) {
               // Dibujar círculo del punto
               ctx.beginPath();
               ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI);
               ctx.fillStyle = point.color;
               ctx.fill();
               ctx.strokeStyle = '#000000';
               ctx.lineWidth = 1;
               ctx.stroke();
               
               // Dibujar etiqueta si está habilitado
               if (showLabels.checked) {
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
                   ctx.font = 'bold 12px Arial';
                   ctx.fillText(pointName, labelX, labelY);
               }
           }
       });
       
       ctx.restore();
   }
   
   // Dibujar conexiones entre puntos para el frame actual
   function drawFrameConnections(frameData) {
       // Crear mapa para acceso rápido a los puntos por índice
       const pointMap = {};
       frameData.forEach(point => {
           pointMap[point.point] = point;
       });
       
       // Dibujar conexiones
       ctx.strokeStyle = lineColor;
       ctx.lineWidth = 2;
       
       POSE_CONNECTIONS.forEach(connection => {
           const fromPoint = pointMap[connection[0]];
           const toPoint = pointMap[connection[1]];
           
           // Verificar si ambos puntos existen y son visibles
           if (
               fromPoint && toPoint && 
               fromPoint.visibility > 0.5 && toPoint.visibility > 0.5
           ) {
               // Verificar si alguno de los puntos está en un grupo filtrado
               const fromGroup = pointToGroup[fromPoint.point];
               const toGroup = pointToGroup[toPoint.point];
               
               if (
                   filteredGroups.length === 0 || 
                   (filteredGroups.includes(fromGroup) && filteredGroups.includes(toGroup))
               ) {
                   // Dibujar línea
                   ctx.beginPath();
                   ctx.moveTo(fromPoint.x, fromPoint.y);
                   ctx.lineTo(toPoint.x, toPoint.y);
                   ctx.stroke();
               }
           }
       });
   }
   
   // Manejar resultados de la pose
   function onPoseResults(results) {
       // Limpiar el canvas completamente
       ctx.save();
       ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
       
       // Almacenar los datos de la pose para el frame actual
       let poseData = [];
       
       // Dibujar pose si se detecta
       if (results.poseLandmarks) {
           // Dibujar conexiones
           if (showConnections.checked) {
               drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, 
                   {color: lineColor, lineWidth: 2});
           }
           
           // Dibujar landmarks con colores personalizados y etiquetas
           results.poseLandmarks.forEach((landmark, index) => {
               const x = landmark.x * canvasElement.width;
               const y = landmark.y * canvasElement.height;
               const color = getPointColor(index);
               
               // Verificar si el grupo del punto está filtrado
               const pointGroup = pointToGroup[index];
               if (filteredGroups.length > 0 && !filteredGroups.includes(pointGroup)) {
                   // Solo guardar datos si el punto no está filtrado
                   poseData.push({
                       point: index,
                       color: color,
                       x: Math.round(x),
                       y: Math.round(y),
                       visibility: landmark.visibility ? landmark.visibility.toFixed(2) : 0
                   });
                   return;
               }
               
               // Solo dibujar si es visible (threshold de 0.5)
               if (landmark.visibility > 0.5) {
                   // Dibujar círculo del punto
                   ctx.beginPath();
                   ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
                   ctx.fillStyle = color;
                   ctx.fill();
                   ctx.strokeStyle = '#000000';
                   ctx.lineWidth = 1;
                   ctx.stroke();
                   
                   // Dibujar etiqueta si está habilitado
                   if (showLabels.checked) {
                       ctx.fillStyle = "white";
                       ctx.strokeStyle = "black";
                       ctx.lineWidth = 2;
                       ctx.font = "12px Arial";
                       ctx.strokeText(index, x + 10, y);
                       ctx.fillText(index, x + 10, y);
                   }
               }
               
               // Guardar datos del punto
               poseData.push({
                   point: index,
                   color: color,
                   x: Math.round(x),
                   y: Math.round(y),
                   visibility: landmark.visibility ? landmark.visibility.toFixed(2) : 0
               });
           });
           
           // Guardar datos para el frame actual
           poseDataFrames[currentFrame] = poseData;
           
           // Mostrar datos en la tabla
           displayPoseData(currentFrame);
       }
       
       ctx.restore();
       
       // Actualizar estado para videos grabados
       currentFrame++;
       statusText.textContent = `Procesando frame ${currentFrame} de ${totalFrames}`;
       frameSlider.value = currentFrame;
       frameValue.textContent = currentFrame;
       
       // Habilitar el botón de exportar si hay datos
       if (poseDataFrames.length > 0) {
           exportButton.disabled = false;
       }
       
       if (!isPaused && currentFrame < totalFrames) {
           // Utilizar setTimeout para controlar la velocidad de procesamiento
           setTimeout(processNextFrame, 1000 / processingSpeed);
       } else if (currentFrame >= totalFrames) {
           statusText.textContent = "Procesamiento completado";
           playPauseButton.textContent = "Reiniciar";
       }
       
       isProcessing = false;
   }
   
   // Mostrar datos de pose en la tabla
   function displayPoseData(frameIndex) {
       tableBody.innerHTML = '';
       
       if (frameIndex >= poseDataFrames.length || !poseDataFrames[frameIndex]) {
           return;
       }
       
       const frameData = poseDataFrames[frameIndex];
       
       frameData.forEach(point => {
           const row = document.createElement('tr');
           
           const pointCell = document.createElement('td');
           pointCell.textContent = point.point;
           row.appendChild(pointCell);
           
           const groupCell = document.createElement('td');
           groupCell.textContent = pointToGroup[point.point] || "Desconocido";
           row.appendChild(groupCell);
           
           const colorCell = document.createElement('td');
           const colorBox = document.createElement('div');
           colorBox.style.width = '15px';
           colorBox.style.height = '15px';
           colorBox.style.backgroundColor = point.color;
           colorBox.style.margin = '0 auto';
           colorBox.style.border = '1px solid #333';
           colorCell.appendChild(colorBox);
           row.appendChild(colorCell);
           
           const xCell = document.createElement('td');
           xCell.textContent = point.x;
           row.appendChild(xCell);
           
           const yCell = document.createElement('td');
           yCell.textContent = point.y;
           row.appendChild(yCell);
           
           const visCell = document.createElement('td');
           visCell.textContent = point.visibility;
           row.appendChild(visCell);
           
           tableBody.appendChild(row);
       });
   }
   
   // Exportar datos a CSV
   exportButton.addEventListener('click', () => {
       let csv = 'Frame,Punto,Grupo,Color,X,Y,Visibilidad\n';
       
       poseDataFrames.forEach((frameData, frameIndex) => {
           if (frameData) {
               frameData.forEach(point => {
                   // Encontrar a qué grupo pertenece el punto
                   let groupName = pointToGroup[point.point] || "Desconocido";
                   
                   csv += `${frameIndex},${point.point},${groupName},${point.color},${point.x},${point.y},${point.visibility}\n`;
               });
           }
       });
       
       const blob = new Blob([csv], { type: 'text/csv' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = 'pose_data_with_groups.csv';
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
   });
   
   // Procesar el siguiente frame del video grabado
   function processNextFrame() {
       if (isProcessing || isPaused) return;
       
       // Establecer el tiempo del video al frame actual
       const duration = recordedVideo.duration;
       if (duration) {
           recordedVideo.currentTime = (currentFrame / totalFrames) * duration;
           
           // Esperar a que el video se actualice al tiempo establecido
           recordedVideo.onseeked = function() {
               recordedVideo.onseeked = null;
               isProcessing = true;
               
               // Crear un canvas temporal para capturar el frame actual
               const tempCanvas = document.createElement('canvas');
               tempCanvas.width = videoElement.videoWidth || 640;
               tempCanvas.height = videoElement.videoHeight || 480;
               const tempCtx = tempCanvas.getContext('2d');
               tempCtx.drawImage(recordedVideo, 0, 0, tempCanvas.width, tempCanvas.height);
               
               // Procesar el frame con MediaPipe
               pose.send({image: tempCanvas});
           };
       }
   }
   
   // Iniciar la cámara
   startButton.addEventListener('click', async () => {
       try {
           // Acceder a la cámara
           stream = await navigator.mediaDevices.getUserMedia({ 
               video: { 
                   width: 640,
                   height: 480,
                   facingMode: 'user'
               },
               audio: false 
           });
           
           videoElement.srcObject = stream;
           
           statusText.textContent = "Cámara conectada. Puedes empezar a grabar.";
           startButton.disabled = true;
           recordButton.disabled = false;
           
       } catch (err) {
           statusText.textContent = "Error: " + err.message;
           statusText.style.color = "red";
           console.error("Error accediendo a la cámara: ", err);
       }
   });
   
   // Iniciar grabación
   recordButton.addEventListener('click', () => {
       if (!stream) return;
       
       // Restablecer los chunks de grabación y datos de pose
       recordedChunks = [];
       poseDataFrames = [];
       
       // Configurar opciones del MediaRecorder
       const options = { mimeType: 'video/webm;codecs=vp9,opus' };
       
       try {
           mediaRecorder = new MediaRecorder(stream, options);
       } catch (e) {
           console.error('Error creando MediaRecorder:', e);
           // Intentar con otro formato si vp9 no está disponible
           try {
               mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
           } catch (e2) {
               console.error('Error creando MediaRecorder con formato alternativo:', e2);
               statusText.textContent = "Error: Tu navegador no soporta la grabación de video";
               return;
           }
       }
       
       // Manejar datos de grabación
       mediaRecorder.ondataavailable = (event) => {
           if (event.data && event.data.size > 0) {
               recordedChunks.push(event.data);
           }
       };
       
       // Al terminar la grabación
       mediaRecorder.onstop = () => {
           recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
           recordedVideo.src = URL.createObjectURL(recordedBlob);
           recordedVideo.style.display = 'block';
           videoElement.style.display = 'none';
           canvasElement.style.display = 'none';
           processButton.disabled = false;
           
           statusText.textContent = "Grabación completada. Presiona 'Procesar' para aplicar MediaPipe.";
       };
       
       // Iniciar grabación
       mediaRecorder.start(100); // Grabar en chunks de 100ms
       statusText.textContent = "Grabando...";
       recordButton.disabled = true;
       stopButton.disabled = false;
   });
   
   // Detener grabación
   stopButton.addEventListener('click', () => {
       if (mediaRecorder && mediaRecorder.state !== 'inactive') {
           mediaRecorder.stop();
           statusText.textContent = "Procesando grabación...";
           stopButton.disabled = true;
       }
   });
   
   // Procesar video con MediaPipe
   processButton.addEventListener('click', () => {
       // Inicializar MediaPipe si no se ha hecho
       if (!pose) {
           initPose();
       }
       
       // Limpiar datos de pose previos
       poseDataFrames = [];
       
       processButton.disabled = true;
       playPauseButton.disabled = false;
       
       // Ocultar el video grabado y mostrar el canvas
       recordedVideo.style.display = 'none';
       canvasElement.style.display = 'block';
       
       // Preparar para procesar el video
       currentFrame = 0;
       isPaused = false;
       
       // Establecer un número aproximado de frames a procesar (10 frames por segundo)
       const videoDuration = recordedVideo.duration || 0;
       totalFrames = Math.max(1, Math.floor(videoDuration * 10));
       
       // Actualizar el slider de frames
       frameSlider.max = totalFrames - 1;
       frameSlider.value = 0;
       frameValue.textContent = "0";
       totalFrameValue.textContent = totalFrames - 1;
       
       statusText.textContent = "Iniciando procesamiento con MediaPipe...";
       playPauseButton.textContent = "Pausar";
       
       // Reproducir el video y pausarlo inmediatamente
       recordedVideo.play();
       recordedVideo.pause();
       
       // Iniciar el procesamiento de frames
       isProcessing = false;
       processNextFrame();
   });
   
   // Pausar/Reanudar/Reiniciar procesamiento
   playPauseButton.addEventListener('click', () => {
       if (currentFrame >= totalFrames) {
           // Reiniciar procesamiento
           currentFrame = 0;
           isPaused = false;
           playPauseButton.textContent = "Pausar";
           processNextFrame();
       } else {
           // Alternar pausa/reproducción
           isPaused = !isPaused;
           playPauseButton.textContent = isPaused ? "Reanudar" : "Pausar";
           
           if (!isPaused) {
               processNextFrame();
           }
       }
   });
   
   // Función para los conectores de pose
   function drawConnectors(canvasCtx, landmarks, connections, options) {
       const { color = '#00FF00', lineWidth = 1 } = options || {};
       
       canvasCtx.strokeStyle = color;
       canvasCtx.lineWidth = lineWidth;
       
       for (const connection of connections) {
           const from = landmarks[connection[0]];
           const to = landmarks[connection[1]];
           if (from && to) {
               if (from.visibility > 0.5 && to.visibility > 0.5) {
                   canvasCtx.beginPath();
                   canvasCtx.moveTo(from.x * canvasElement.width, from.y * canvasElement.height);
                   canvasCtx.lineTo(to.x * canvasElement.width, to.y * canvasElement.height);
                   canvasCtx.stroke();
               }
           }
       }
   }
   
           // Definir constante para las conexiones de la pose
           const POSE_CONNECTIONS = [
               [0, 1], [0, 4], [1, 2], [2, 3], [3, 7], [4, 5],
               [5, 6], [6, 8], [9, 10], [11, 12], [11, 13],
               [11, 23], [12, 14], [12, 24], [13, 15], [14, 16],
               [15, 17], [15, 19], [15, 21], [16, 18], [16, 20],
               [16, 22], [17, 19], [18, 20], [23, 24], [23, 25],
               [24, 26], [25, 27], [26, 28], [27, 29], [28, 30],
               [29, 31], [30, 32], [27, 31], [28, 32]
           ];


        // Actualizar la función de dibujar el frame actual
function drawCurrentFrame() {
    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    if (currentFrame >= poseDataFrames.length || !poseDataFrames[currentFrame]) {
        ctx.restore();
        return;
    }
    
    const frameData = poseDataFrames[currentFrame];
    
    // Dibujar conexiones si está habilitado y hay grupos seleccionados
    if (showConnections.checked) {
        drawFrameConnections(frameData);
    }
    
    // Dibujar puntos
    frameData.forEach(point => {
        // Verificar si el grupo del punto está filtrado
        const pointGroup = pointToGroup[point.point];
        if (filteredGroups.length > 0 && !filteredGroups.includes(pointGroup)) {
            return;
        }
        
        // Solo dibujar si es visible
        if (point.visibility > 0.5) {
            // Dibujar círculo del punto
            ctx.beginPath();
            ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI);
            ctx.fillStyle = point.color;
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Dibujar etiqueta si está habilitado
            if (showLabels.checked) {
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
                ctx.font = 'bold 12px Arial';
                ctx.fillText(pointName, labelX, labelY);
            }
        }
    });
    
    ctx.restore();
}

// Actualizar la función de dibujar conexiones
function drawFrameConnections(frameData) {
    // Crear mapa para acceso rápido a los puntos por índice
    const pointMap = {};
    frameData.forEach(point => {
        pointMap[point.point] = point;
    });
    
    // Dibujar conexiones
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    
    POSE_CONNECTIONS.forEach(connection => {
        const fromPoint = pointMap[connection[0]];
        const toPoint = pointMap[connection[1]];
        
        // Verificar si ambos puntos existen y son visibles
        if (
            fromPoint && toPoint && 
            fromPoint.visibility > 0.5 && toPoint.visibility > 0.5
        ) {
            // Verificar si ambos puntos pertenecen a grupos seleccionados
            const fromGroup = pointToGroup[fromPoint.point];
            const toGroup = pointToGroup[toPoint.point];
            
            // Solo dibujar conexiones dentro del mismo grupo cuando hay filtros activos
            if (
                filteredGroups.length === 0 || 
                (filteredGroups.includes(fromGroup) && filteredGroups.includes(toGroup))
            ) {
                // Dibujar línea
                ctx.beginPath();
                ctx.moveTo(fromPoint.x, fromPoint.y);
                ctx.lineTo(toPoint.x, toPoint.y);
                ctx.stroke();
            }
        }
    });
}

// Actualizar la función que maneja los resultados de la pose
function onPoseResults(results) {
    // Limpiar el canvas completamente
    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Almacenar los datos de la pose para el frame actual
    let poseData = [];
    
    // Dibujar pose si se detecta
    if (results.poseLandmarks) {
        // Dibujar conexiones
        if (showConnections.checked) {
            drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, 
                {color: lineColor, lineWidth: 2});
        }
        
        // Procesar todos los landmarks
        results.poseLandmarks.forEach((landmark, index) => {
            const x = landmark.x * canvasElement.width;
            const y = landmark.y * canvasElement.height;
            const color = getPointColor(index);
            const pointGroup = pointToGroup[index];
            
            // Guardar datos del punto (siempre guardamos todos los puntos)
            poseData.push({
                point: index,
                color: color,
                group: pointGroup || "Desconocido",
                x: Math.round(x),
                y: Math.round(y),
                visibility: landmark.visibility ? landmark.visibility.toFixed(2) : 0
            });
            
            // Verificar si el grupo del punto está filtrado para visualización
            if (filteredGroups.length > 0 && !filteredGroups.includes(pointGroup)) {
                return;
            }
            
            // Solo dibujar si es visible (threshold de 0.5)
            if (landmark.visibility > 0.5) {
                // Dibujar círculo del punto
                ctx.beginPath();
                ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Dibujar etiqueta si está habilitado
                if (showLabels.checked) {
                    ctx.fillStyle = "white";
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 2;
                    ctx.font = "12px Arial";
                    ctx.strokeText(index, x + 10, y);
                    ctx.fillText(index, x + 10, y);
                }
            }
        });
        
        // Guardar datos para el frame actual
        poseDataFrames[currentFrame] = poseData;
        
        // Mostrar datos en la tabla
        displayPoseData(currentFrame);
    }
    
    ctx.restore();
    
    // Actualizar estado para videos grabados
    currentFrame++;
    statusText.textContent = `Procesando frame ${currentFrame} de ${totalFrames}`;
    frameSlider.value = currentFrame;
    frameValue.textContent = currentFrame;
    
    // Habilitar el botón de exportar si hay datos
    if (poseDataFrames.length > 0) {
        exportButton.disabled = false;
    }
    
    if (!isPaused && currentFrame < totalFrames) {
        // Utilizar setTimeout para controlar la velocidad de procesamiento
        setTimeout(processNextFrame, 1000 / processingSpeed);
    } else if (currentFrame >= totalFrames) {
        statusText.textContent = "Procesamiento completado";
        playPauseButton.textContent = "Reiniciar";
    }
    
    isProcessing = false;
}

// Actualizar la función para mostrar datos en la tabla
function displayPoseData(frameIndex) {
    tableBody.innerHTML = '';
    
    if (frameIndex >= poseDataFrames.length || !poseDataFrames[frameIndex]) {
        return;
    }
    
    const frameData = poseDataFrames[frameIndex];
    
    frameData.forEach(point => {
        const row = document.createElement('tr');
        const pointGroup = point.group;
        
        // Determinar si este punto pertenece a un grupo filtrado
        const isFiltered = filteredGroups.length > 0 && !filteredGroups.includes(pointGroup);
        
        // Añadir clase para resaltar filas de grupos filtrados/no filtrados
        if (isFiltered) {
            row.classList.add('filtered-row');
            row.style.opacity = '0.5';
        }
        
        const pointCell = document.createElement('td');
        pointCell.textContent = point.point;
        row.appendChild(pointCell);
        
        const nameCell = document.createElement('td');
        nameCell.textContent = pointNames[point.point] || "";
        row.appendChild(nameCell);
        
        const groupCell = document.createElement('td');
        groupCell.textContent = pointGroup;
        row.appendChild(groupCell);
        
        const colorCell = document.createElement('td');
        const colorBox = document.createElement('div');
        colorBox.style.width = '15px';
        colorBox.style.height = '15px';
        colorBox.style.backgroundColor = point.color;
        colorBox.style.margin = '0 auto';
        colorBox.style.border = '1px solid #333';
        colorCell.appendChild(colorBox);
        row.appendChild(colorCell);
        
        // Mostrar coordenadas reales solo si el punto no está filtrado, sino mostrar ceros
        const xCell = document.createElement('td');
        xCell.textContent = isFiltered ? "0" : point.x;
        row.appendChild(xCell);
        
        const yCell = document.createElement('td');
        yCell.textContent = isFiltered ? "0" : point.y;
        row.appendChild(yCell);
        
        const visCell = document.createElement('td');
        visCell.textContent = isFiltered ? "0" : point.visibility;
        row.appendChild(visCell);
        
        tableBody.appendChild(row);
    });
}

// Mejorar la función que genera los botones de filtro por grupo
function generateGroupFilters() {
    // Limpiar contenedor actual
    groupFilter.innerHTML = '';
    
    // Botón para todos los grupos
    const allButton = document.createElement('button');
    allButton.textContent = 'Todos';
    allButton.className = 'group-button active';
    allButton.style.backgroundColor = '#555';
    allButton.style.color = 'white';
    allButton.onclick = () => {
        filteredGroups = [];
        updateGroupFilterButtons();
        drawCurrentFrame();
        displayPoseData(currentFrame); // Actualizar tabla también
    };
    groupFilter.appendChild(allButton);
    
    // Botón para cada grupo
    pointGroups.forEach(group => {
        const button = document.createElement('button');
        button.textContent = group.name;
        button.className = 'group-button';
        button.style.backgroundColor = group.color;
        button.style.color = getContrastColor(group.color);
        
        // Mejorar el manejo de clics
        button.onclick = () => {
            // Si están todos deseleccionados y hacemos clic en uno, mostrar solo ese
            if (filteredGroups.length === 0) {
                filteredGroups = pointGroups.map(g => g.name);
                filteredGroups = filteredGroups.filter(g => g !== group.name);
            } else {
                const index = filteredGroups.indexOf(group.name);
                if (index > -1) {
                    // Si está seleccionado, quitarlo del filtro
                    filteredGroups.splice(index, 1);
                    
                    // Si no queda ninguno seleccionado, mostrar todos
                    if (filteredGroups.length === 0) {
                        filteredGroups = [];
                    }
                } else {
                    // Si no está seleccionado, añadirlo al filtro
                    filteredGroups.push(group.name);
                }
            }
            
            updateGroupFilterButtons();
            drawCurrentFrame();
            displayPoseData(currentFrame); // Actualizar tabla también
        };
        
        groupFilter.appendChild(button);
    });
}

// Mejorar el exportador de datos a CSV para incluir todos los datos relevantes
exportButton.addEventListener('click', () => {
    let csv = 'Frame,Punto,Nombre,Grupo,Color,X,Y,Visibilidad,Visible\n';
    
    poseDataFrames.forEach((frameData, frameIndex) => {
        if (frameData) {
            frameData.forEach(point => {
                // Determinar si este punto pertenece a un grupo filtrado actualmente
                const isFiltered = filteredGroups.length > 0 && !filteredGroups.includes(point.group);
                
                // Generar los valores de X e Y según el filtrado
                const xValue = isFiltered ? "0" : point.x;
                const yValue = isFiltered ? "0" : point.y;
                const visibilityValue = isFiltered ? "0" : point.visibility;
                
                // Añadir una columna que indique si el punto está visible según los filtros
                const visibleValue = isFiltered ? "No" : "Sí";
                
                csv += `${frameIndex},${point.point},"${pointNames[point.point] || ''}",${point.group},${point.color},${xValue},${yValue},${visibilityValue},${visibleValue}\n`;
            });
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pose_data_with_groups.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

// Mejora el rastreo de posición del mouse para una mejor experiencia
canvasElement.addEventListener('mousemove', function(event) {
    const rect = canvasElement.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    
    if (showHoverInfo.checked && poseDataFrames[currentFrame]) {
        const hoveredPoint = findHoveredPoint();
        
        if (hoveredPoint) {
            // Verificar si el punto está en un grupo filtrado
            const pointGroup = pointToGroup[hoveredPoint.point];
            const isFiltered = filteredGroups.length > 0 && !filteredGroups.includes(pointGroup);
            
            if (!isFiltered) {
                pointInfo.style.display = 'block';
                pointInfo.style.left = `${event.clientX + 10}px`;
                pointInfo.style.top = `${event.clientY + 10}px`;
                
                const pointName = pointNames[hoveredPoint.point] || `Punto ${hoveredPoint.point}`;
                
                pointInfo.innerHTML = `
                    <strong>${pointName}</strong><br>
                    Grupo: ${pointGroup}<br>
                    X: ${hoveredPoint.x}, Y: ${hoveredPoint.y}<br>
                    Visibilidad: ${hoveredPoint.visibility}
                `;
            } else {
                pointInfo.style.display = 'none';
            }
        } else {
            pointInfo.style.display = 'none';
        }
    } else {
        pointInfo.style.display = 'none';
    }
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
          <p>⚠️ Si vuelves al inicio, <strong>se eliminarán los datos de las gráficas importadas o en tiempo real</strong>.<br>
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
          <p>⚠️ Esto <strong>enviará los datos finales al paciente de la gráfica y tabla</strong>.<br>
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
          const datosMediapipe = JSON.parse(localStorage.getItem("tabla_mediapipe") || "[]");
  
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

  
          } catch (error) {
            console.error(error);
            mostrarMensaje("❌ Error al finalizar sesión", "error");
          }
        };
      });
    }
  });
  
  

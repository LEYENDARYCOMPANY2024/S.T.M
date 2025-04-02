
// Enhanced MediaPipe Processing Script
let processedFrames = [];
let mediaRecorder;
let recordedChunks = [];
let stream;
let isRecording = false;
let videoElement, canvasElement, recordedVideoElement;
let processButton, recordButton, startButton, stopButton;
let recordButtonText = 'Grabar';
let lastPoseLandmarks = null;
const smoothingFactor = 0.3; // Factor de suavizado para estabilizar landmarks

// Initialize DOM elements
function initializeElements() {
    videoElement = document.getElementById('videoElement');
    canvasElement = document.getElementById('canvasElement');
    recordedVideoElement = document.getElementById('recordedVideo');
    processButton = document.getElementById('processButton');
    recordButton = document.getElementById('recordButton');
    startButton = document.getElementById('startButton');
    stopButton = document.getElementById('stopButton');
}

// Enhanced MediaPipe Landmark Identification
// Modificado para usar números como identificadores y colores específicos por zona corporal
// Enhanced MediaPipe Landmark Identification
// Modified to include all 33 landmarks from MediaPipe Pose
const POSE_LANDMARKS = {
    // Face and Head - Color Red
    NOSE: { index: 0, name: '0', color: '#FF0000' },
    LEFT_EYE_INNER: { index: 1, name: '1', color: '#FF0000' },
    LEFT_EYE: { index: 2, name: '2', color: '#FF0000' },
    LEFT_EYE_OUTER: { index: 3, name: '3', color: '#FF0000' },
    RIGHT_EYE_INNER: { index: 4, name: '4', color: '#FF0000' },
    RIGHT_EYE: { index: 5, name: '5', color: '#FF0000' },
    RIGHT_EYE_OUTER: { index: 6, name: '6', color: '#FF0000' },
    LEFT_EAR: { index: 7, name: '7', color: '#FF0000' },
    RIGHT_EAR: { index: 8, name: '8', color: '#FF0000' },
    MOUTH_LEFT: { index: 9, name: '9', color: '#FF0000' },
    MOUTH_RIGHT: { index: 10, name: '10', color: '#FF0000' },
    
    // Upper Body - Left side red, right side green
    LEFT_SHOULDER: { index: 11, name: '11', color: '#00FF00' },
    RIGHT_SHOULDER: { index: 12, name: '12', color: '#00FF00' },
    LEFT_ELBOW: { index: 13, name: '13', color: '#800080' },
    RIGHT_ELBOW: { index: 14, name: '14', color: '#800080' },
    LEFT_WRIST: { index: 15, name: '15', color: '#800080' },
    RIGHT_WRIST: { index: 16, name: '16', color: '#800080' },
    
    // Hands - Purple
    LEFT_PINKY: { index: 17, name: '17', color: '#800080' },
    RIGHT_PINKY: { index: 18, name: '18', color: '#800080' },
    LEFT_INDEX: { index: 19, name: '19', color: '#800080' },
    RIGHT_INDEX: { index: 20, name: '20', color: '#800080' },
    LEFT_THUMB: { index: 21, name: '21', color: '#800080' },
    RIGHT_THUMB: { index: 22, name: '22', color: '#800080' },
    
    // Torso - Green
    LEFT_HIP: { index: 23, name: '23', color: '#00FF00' },
    RIGHT_HIP: { index: 24, name: '24', color: '#00FF00' },
    
    // Lower Body - Left side orange, right side purple
    LEFT_KNEE: { index: 25, name: '25', color: '#FFA500' },
    RIGHT_KNEE: { index: 26, name: '26', color: '#FFA500' },
    LEFT_ANKLE: { index: 27, name: '27', color: '#FFA500' },
    RIGHT_ANKLE: { index: 28, name: '28', color: '#FFA500' },
    
    // Feet
    LEFT_HEEL: { index: 29, name: '29', color: '#FFA500' },
    RIGHT_HEEL: { index: 30, name: '30', color: '#FFA500' },
    LEFT_FOOT_INDEX: { index: 31, name: '31', color: '#FFA500' },
    RIGHT_FOOT_INDEX: { index: 32, name: '32', color: '#FFA500' }
};

// Define pose connections for drawing the skeleton
const POSE_CONNECTIONS = [
    // Face connections
    [0, 1], [1, 2], [2, 3], [3, 7], 
    [0, 4], [4, 5], [5, 6], [6, 8],
    [9, 10], // mouth
    
    // Upper body connections
    [11, 12], // shoulders
    [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], // left arm and hand
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], // right arm and hand
    
    // Torso connections
    [11, 23], [12, 24], // shoulders to hips
    [23, 24], // hip line
    
    // Lower body connections
    [23, 25], [25, 27], [27, 29], [27, 31], // left leg
    [24, 26], [26, 28], [28, 30], [28, 32]  // right leg
];


// Camera and Recording Setup
async function initializeCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
            } 
        });
        
        videoElement.srcObject = stream;
        videoElement.play();

        // Enable buttons
        recordButton.disabled = false;
        stopButton.disabled = false;
        startButton.textContent = 'Cambiar Cámara';
        startButton.classList.remove('btn-primary');
        startButton.classList.add('btn-warning');

        // Setup media recorder
        mediaRecorder = new MediaRecorder(stream, { 
            mimeType: 'video/webm' 
        });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const videoURL = URL.createObjectURL(blob);
            recordedVideoElement.src = videoURL;
            recordedVideoElement.style.display = 'block';
            
            // Enable process button after recording
            processButton.disabled = false;
        };

    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
}

// Función para obtener detalles de landmark por índice
function getLandmarkDetails(index) {
    return Object.values(POSE_LANDMARKS).find(landmark => landmark.index === index);
}

// Función para verificar la calidad de la detección
function checkDetectionQuality(landmarks) {
    if (!landmarks || landmarks.length === 0) return false;
    
    // Cuenta cuántos landmarks están visibles
    const visibleLandmarks = landmarks.filter(lm => lm.visibility > 0.5).length;
    const visibilityRatio = visibleLandmarks / landmarks.length;
    
    if (visibilityRatio < 0.7) {
        showNotification('Detección limitada. Intenta mejorar la iluminación o la posición.', 'warning');
        return false;
    }
    return true;
}

// Función modificada para guardar datos localmente en lugar de enviarlos a Supabase
async function sendProcessedData(processedFrames) {
    try {
        // En lugar de usar Supabase, guardamos los datos localmente
        const dataToSave = processedFrames.map(frame => ({
            session_id: new Date().getTime(), // Usamos timestamp como ID de sesión
            timestamp: frame.timestamp,
            landmarks: frame.landmarks
        }));
        
        // Guardar en localStorage (con un límite de tamaño)
        const jsonData = JSON.stringify(dataToSave);
        localStorage.setItem('poseData', jsonData);
        
        console.log('Datos guardados localmente');
        showNotification('Datos guardados localmente', 'success');
        
        // Opcional: Permitir descarga de datos en formato JSON
        offerDataDownload(dataToSave);
        
    } catch (err) {
        console.error('Error al guardar datos:', err);
        showNotification('Error al guardar datos localmente', 'error');
    }
}

// Función para ofrecer descarga de datos
function offerDataDownload(data) {
    // Crear botón de descarga
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Descargar Datos JSON';
    downloadButton.classList.add('btn', 'btn-success', 'mt-3');
    downloadButton.addEventListener('click', () => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `pose_data_${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // Agregar botón a la interfaz
    const buttonContainer = document.querySelector('.button-row') || document.body;
    const existingButton = document.getElementById('downloadDataButton');
    if (existingButton) {
        buttonContainer.removeChild(existingButton);
    }
    downloadButton.id = 'downloadDataButton';
    buttonContainer.appendChild(downloadButton);
}

// Función de notificación
function showNotification(message, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
        // Crear contenedor de mensajes si no existe
        const newContainer = document.createElement('div');
        newContainer.id = 'message-container';
        newContainer.style.position = 'fixed';
        newContainer.style.top = '20px';
        newContainer.style.right = '20px';
        newContainer.style.zIndex = '1000';
        document.body.appendChild(newContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.padding = '10px 15px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.color = 'white';
    
    // Establecer color de fondo según el tipo
    if (type === 'success') notification.style.backgroundColor = '#28a745';
    else if (type === 'error') notification.style.backgroundColor = '#dc3545';
    else if (type === 'warning') notification.style.backgroundColor = '#ffc107';
    else notification.style.backgroundColor = '#17a2b8';
    
    notification.textContent = message;
    
    const container = document.getElementById('message-container');
    container.appendChild(notification);
    
    // Eliminar la notificación después de 3 segundos
    setTimeout(() => {
        container.removeChild(notification);
    }, 3000);
}

// Añadir botón de envío manual de datos
function addManualSendButton() {
    const buttonRow = document.querySelector('.button-row');
    
    // Si no existe, crear la fila de botones
    if (!buttonRow) {
        const newButtonRow = document.createElement('div');
        newButtonRow.className = 'button-row';
        newButtonRow.style.margin = '10px 0';
        document.body.appendChild(newButtonRow);
    }
    
    const container = document.querySelector('.button-row') || document.body;
    
    // Crear botón
    const sendButton = document.createElement('button');
    sendButton.id = 'manualSendButton';
    sendButton.textContent = 'Guardar Datos';
    sendButton.className = 'btn btn-info';
    sendButton.style.marginRight = '10px';
    
    sendButton.addEventListener('click', async () => {
        if (processedFrames && processedFrames.length > 0) {
            await sendProcessedData(processedFrames);
        } else {
            showNotification('No hay datos para guardar', 'warning');
        }
    });
    
    container.appendChild(sendButton);
    
    // Agregar botón para modo debug
    const debugButton = document.createElement('button');
    debugButton.id = 'debugButton';
    debugButton.textContent = 'Modo Debug';
    debugButton.className = 'btn btn-secondary';
    debugButton.style.marginRight = '10px';
    
    debugButton.addEventListener('click', () => {
        const debugMode = document.body.classList.toggle('debug-mode');
        if (debugMode) {
            showNotification('Modo debug activado', 'info');
        } else {
            showNotification('Modo debug desactivado', 'info');
        }
    });
    
    container.appendChild(debugButton);
}

// Agregar consejos para mejor detección
function addDetectionTips() {
    const instructionsDiv = document.createElement('div');
    instructionsDiv.className = 'alert alert-info';
    instructionsDiv.innerHTML = `
        <h4>Consejos para mejor detección:</h4>
        <ul>
            <li>Asegúrate de tener buena iluminación</li>
            <li>Mantén una distancia adecuada de la cámara (cuerpo completo visible)</li>
            <li>Usa ropa que contraste con el fondo</li>
            <li>Evita fondos complejos o en movimiento</li>
        </ul>
    `;
    
    // Insertar antes de la fila de botones o al principio del body
    const buttonRow = document.querySelector('.button-row');
    if (buttonRow) {
        document.body.insertBefore(instructionsDiv, buttonRow);
    } else {
        document.body.insertBefore(instructionsDiv, document.body.firstChild);
    }
}

    
// Process Video with MediaPipe
async function processVideoWithMediaPipe() {
    // Clear previous processed frames
    processedFrames = [];
    lastPoseLandmarks = null;
    
    // Hide video and show canvas
    videoElement.style.display = 'none';
    recordedVideoElement.style.display = 'none';
    canvasElement.style.display = 'block';
    
    // Setup MediaPipe Pose
    const pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
    });

    pose.setOptions({
        modelComplexity: 2, // Aumentar a 2 para mayor precisión
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.6, // Aumentar a 0.6 para mayor precisión
        minTrackingConfidence: 0.6 // Aumentar a 0.6 para seguimiento más estable
    });

    const canvasCtx = canvasElement.getContext('2d');
    
    // Prepare recorded video for processing
    const videoToProcess = recordedVideoElement;
    
    pose.onResults((results) => {
        // Clear canvas
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        // Only draw pose landmarks
        if (results.poseLandmarks) {
            // Aplicar suavizado temporal si existen landmarks previos
            if (lastPoseLandmarks) {
                results.poseLandmarks.forEach((landmark, i) => {
                    landmark.x = lastPoseLandmarks[i].x * (1 - smoothingFactor) + landmark.x * smoothingFactor;
                    landmark.y = lastPoseLandmarks[i].y * (1 - smoothingFactor) + landmark.y * smoothingFactor;
                    landmark.z = lastPoseLandmarks[i].z * (1 - smoothingFactor) + landmark.z * smoothingFactor;
                });
            }
            
            // Guardar los landmarks para el próximo frame
            lastPoseLandmarks = JSON.parse(JSON.stringify(results.poseLandmarks));
            
            // Verificar la calidad de la detección
            const qualityOk = checkDetectionQuality(results.poseLandmarks);
            
            // Custom drawing with identifiers
            results.poseLandmarks.forEach((landmark, index) => {
                const landmarkDetails = getLandmarkDetails(index);
                
                if (landmarkDetails && landmark.visibility > 0.5) { // Solo dibuja si la visibilidad es buena
                    // Draw landmark
                    canvasCtx.beginPath();
                    canvasCtx.arc(
                        landmark.x * canvasElement.width, 
                        landmark.y * canvasElement.height, 
                        8, // Aumentar tamaño de 5 a 8
                        0, 
                        2 * Math.PI
                    );
                    canvasCtx.fillStyle = landmarkDetails.color;
                    canvasCtx.fill();
                    
                    // Add text label with just the number (not the name)
                    canvasCtx.font = 'bold 14px Arial'; // Fuente más grande y en negrita
                    
                    // Agrega un fondo a las etiquetas
                    const textWidth = canvasCtx.measureText(landmarkDetails.name).width;
                    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    canvasCtx.fillRect(
                        landmark.x * canvasElement.width + 10 - 2,
                        landmark.y * canvasElement.height - 14,
                        textWidth + 4,
                        18
                    );
                    
                    canvasCtx.fillStyle = 'white'; // Texto en blanco para mejor contraste
                    canvasCtx.fillText(
                        landmarkDetails.name, 
                        landmark.x * canvasElement.width + 10, 
                        landmark.y * canvasElement.height
                    );
                    
                    // Mostrar información de debug si está activado
                    if (document.body.classList.contains('debug-mode')) {
                        canvasCtx.fillStyle = 'yellow';
                        canvasCtx.fillText(
                            `v:${landmark.visibility.toFixed(2)}`, 
                            landmark.x * canvasElement.width + 10, 
                            landmark.y * canvasElement.height + 15
                        );
                    }
                }
            });

            // Draw connections with BLACK color instead of using start point color
            if (typeof POSE_CONNECTIONS !== 'undefined') {
                Object.values(POSE_CONNECTIONS).forEach(connection => {
                    const [start, end] = connection;
                    const startLandmark = results.poseLandmarks[start];
                    const endLandmark = results.poseLandmarks[end];
                    
                    if (startLandmark && endLandmark && 
                        startLandmark.visibility > 0.5 && endLandmark.visibility > 0.5) {
                        canvasCtx.beginPath();
                        canvasCtx.moveTo(
                            startLandmark.x * canvasElement.width, 
                            startLandmark.y * canvasElement.height
                        );
                        canvasCtx.lineTo(
                            endLandmark.x * canvasElement.width, 
                            endLandmark.y * canvasElement.height
                        );
                        // Usar color negro fijo para TODAS las líneas
                        canvasCtx.strokeStyle = '#000000';
                        canvasCtx.lineWidth = 2;
                        canvasCtx.stroke();
                    }
                });
            }
            
            // Store processed frame data with more details
            processedFrames.push({
                landmarks: results.poseLandmarks.map((landmark, index) => ({
                    index: index,
                    name: getLandmarkDetails(index)?.name || index.toString(), // Usar número como nombre
                    x: landmark.x,
                    y: landmark.y,
                    z: landmark.z,
                    visibility: landmark.visibility
                })),
                timestamp: videoToProcess.currentTime
            });
        }
    });

    // Prepare video for processing
    videoToProcess.addEventListener('loadedmetadata', () => {
        canvasElement.width = videoToProcess.videoWidth;
        canvasElement.height = videoToProcess.videoHeight;
    });

    // Process video frame by frame
    const processVideo = async () => {
        if (videoToProcess.ended) {
            console.log('Video processing complete');
            console.log('Processed Frames:', processedFrames);
            
// Actualizar tabla de landmarks
if (processedFrames.length > 0) {
    updateLandmarkTable(processedFrames[processedFrames.length - 1]);
}

// Mostrar notificación para guardar los datos
showNotification('Procesamiento completado. Haz clic en "Guardar Datos" para exportar.', 'success');

return;
}

await pose.send({image: videoToProcess});

// Move to next frame
videoToProcess.requestVideoFrameCallback(processVideo);
};

// Start processing
videoToProcess.loop = false;
videoToProcess.play();
await pose.initialize();
videoToProcess.requestVideoFrameCallback(processVideo);
}

// Function to update landmark table
function updateLandmarkTable(processedFrame) {
    let tableBody = document.getElementById('tableBody');
    if (!tableBody) {
      // Crea la tabla si no existe
      const table = document.createElement('table');
      table.className = 'table table-striped';
      table.innerHTML = `
        <thead>
          <tr>
            <th>Índice</th>
            <th>Número</th>
            <th>Color</th>
            <th>X (%)</th>
            <th>Y (%)</th>
            <th>Visibilidad</th>
          </tr>
        </thead>
        <tbody id="tableBody"></tbody>
      `;
      const container = document.createElement('div');
      container.className = 'table-container';
      container.style.marginTop = '20px';
      container.appendChild(table);
      document.body.appendChild(container);
      tableBody = document.getElementById('tableBody');
    }
    
    tableBody.innerHTML = ''; // Limpiar datos anteriores
    
    if (processedFrame && processedFrame.landmarks) {
      processedFrame.landmarks.forEach(landmark => {
        // Sólo agregar si la visibilidad supera el umbral (por ejemplo, 0.5)
        if (landmark.visibility > 0.5) {
          const row = document.createElement('tr');
          // Guardamos el identificador del punto en el dataset para el filtrado
          row.dataset.point = landmark.name;
          row.innerHTML = `
            <td>${landmark.index}</td>
            <td>${landmark.name}</td>
            <td><div style="background-color:${getLandmarkDetails(landmark.index)?.color || '#000'}; width:20px; height:20px;"></div></td>
            <td>${(landmark.x * 100).toFixed(2)}%</td>
            <td>${(landmark.y * 100).toFixed(2)}%</td>
            <td>${landmark.visibility.toFixed(2)}</td>
          `;
          tableBody.appendChild(row);
        }
      });
      document.getElementById("tableFilter").addEventListener("keyup", function() {
        const filterText = this.value.toLowerCase();
        const rows = document.querySelectorAll("#tableBody tr");
        rows.forEach(row => {
          // Comparamos el dataset 'point' (identificador del punto) con el texto del filtro
          const point = row.dataset.point ? row.dataset.point.toLowerCase() : "";
          if (point.includes(filterText)) {
            row.style.display = "";
          } else {
            row.style.display = "none";
          }
        });
      });

      document.getElementById("frameSlider").addEventListener("input", function() {
        const frameIndex = parseInt(this.value, 10);
        if (processedFrames[frameIndex]) {
          updateLandmarkTable(processedFrames[frameIndex]);
          // También puedes actualizar algún label que muestre el frame actual:
          document.getElementById("frameValue").textContent = frameIndex;
        }
      });
// Después de procesar el video, actualizar el slider
document.getElementById("totalFrameValue").textContent = processedFrames.length;
document.getElementById("frameSlider").max = processedFrames.length - 1;
      
      
      // Mensaje si no se detectaron puntos con suficiente visibilidad
      if (tableBody.children.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="6" class="text-center">No se detectaron puntos con visibilidad suficiente</td>`;
        tableBody.appendChild(noDataRow);
      }
    }
  }
  

// Agregar un control deslizante para ajustar el umbral de visibilidad
function addVisibilityThresholdControl() {
    const container = document.createElement('div');
    container.className = 'form-group mt-3';
    container.innerHTML = `
        <label for="visibilityThreshold">Umbral de visibilidad: <span id="thresholdValue">0.5</span></label>
        <input type="range" class="form-control-range" id="visibilityThreshold" 
               min="0" max="1" step="0.1" value="0.5">
        <small class="form-text text-muted">Ajusta este valor para filtrar puntos con baja visibilidad</small>
    `;
    
    document.body.appendChild(container);
    
    // Actualizar al cambiar el umbral
    const slider = document.getElementById('visibilityThreshold');
    const valueDisplay = document.getElementById('thresholdValue');
    
    slider.addEventListener('input', function() {
        valueDisplay.textContent = this.value;
        // Si hay datos procesados, actualizar la tabla con el nuevo umbral
        if (processedFrames.length > 0) {
            updateLandmarkTableWithThreshold(
                processedFrames[processedFrames.length - 1],
                parseFloat(this.value)
            );
        }
    });
}

// Versión modificada que acepta un umbral personalizado
function updateLandmarkTableWithThreshold(processedFrame, threshold = 0.5) {
    let tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; // Clear previous data

    if (processedFrame && processedFrame.landmarks) {
        processedFrame.landmarks.forEach(landmark => {
            // Solo agregar a la tabla si la visibilidad supera el umbral
            if (landmark.visibility > threshold) {
                const row = document.createElement('tr');
                row.dataset.point = landmark.name;
                
                row.innerHTML = `
                    <td>${landmark.index}</td>
                    <td>${landmark.name}</td>
                    <td><div style="background-color:${getLandmarkDetails(landmark.index)?.color || '#000000'}; width:20px; height:20px;"></div></td>
                    <td>${(landmark.x * 100).toFixed(2)}%</td>
                    <td>${(landmark.y * 100).toFixed(2)}%</td>
                    <td>${landmark.visibility.toFixed(2)}</td>
                `;
                tableBody.appendChild(row);
            }
        });
        
        if (tableBody.children.length === 0) {
            const noDataRow = document.createElement('tr');
            noDataRow.innerHTML = `
                <td colspan="6" class="text-center">No se detectaron puntos con visibilidad > ${threshold}</td>
            `;
            tableBody.appendChild(noDataRow);
        }
    }
}

// Record Button Toggle
function toggleRecording() {
    if (!isRecording) {
        recordedChunks = [];
        mediaRecorder.start();
        recordButton.textContent = 'Detener Grabación';
        recordButton.classList.remove('btn-danger');
        recordButton.classList.add('btn-warning');
        isRecording = true;
    } else {
        mediaRecorder.stop();
        recordButton.textContent = recordButtonText;
        recordButton.classList.remove('btn-warning');
        recordButton.classList.add('btn-danger');
        isRecording = false;
    }
}

// Stop Camera and Reset
function stopCameraAndReset() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        stream = null;
        
        // Reset buttons
        startButton.textContent = 'Iniciar Cámara';
        startButton.classList.remove('btn-warning');
        startButton.classList.add('btn-primary');
        recordButton.disabled = true;
        stopButton.disabled = true;
        processButton.disabled = true;

        // Hide recorded video if no recording
        if (recordedChunks.length === 0) {
            recordedVideoElement.style.display = 'none';
        }
    }
}

// Initialize event listeners
function setupEventListeners() {
    // Start Camera
    startButton.addEventListener('click', async () => {
        if (!stream) {
            // First time starting camera
            await initializeCamera();
        } else {
            // Stop current stream and restart
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            videoElement.srcObject = null;
            await initializeCamera();
        }
    });

    // Record Button
    recordButton.addEventListener('click', toggleRecording);

    // Stop Button
    stopButton.addEventListener('click', stopCameraAndReset);

    // Process Button
    processButton.addEventListener('click', processVideoWithMediaPipe);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();
    addManualSendButton();
    addDetectionTips();


    // Initial button states
    recordButton.disabled = true;
    stopButton.disabled = true;
    processButton.disabled = true;
    
    // Crear contenedor de mensajes
    if (!document.getElementById('message-container')) {
        const messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        messageContainer.style.position = 'fixed';
        messageContainer.style.top = '20px';
        messageContainer.style.right = '20px';
        messageContainer.style.zIndex = '1000';
        document.body.appendChild(messageContainer);
    }
});



// Función para mostrar notificación con animación
function showNotification(message, type = 'info') {
    const messageContainer = document.getElementById('message-container') || createMessageContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Aplicar animaciones CSS
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease-in-out';

    messageContainer.appendChild(notification);
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
    });

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => messageContainer.removeChild(notification), 500);
    }, 3000);
}

// Crear contenedor de mensajes si no existe
function createMessageContainer() {
    const newContainer = document.createElement('div');
    newContainer.id = 'message-container';
    newContainer.style.position = 'fixed';
    newContainer.style.top = '20px';
    newContainer.style.right = '20px';
    newContainer.style.zIndex = '1000';
    document.body.appendChild(newContainer);
    return newContainer;
}

// Botón de guardar datos con animación
function addManualSendButton() {
    const container = document.querySelector('.button-row') || createButtonRow();

    const sendButton = document.createElement('button');
    sendButton.id = 'manualSendButton';
    sendButton.textContent = 'Guardar Datos';
    sendButton.className = 'btn btn-info animated-btn';
    
    sendButton.addEventListener('click', async () => {
        if (processedFrames.length > 0) {
            await sendProcessedData(processedFrames);
            showNotification('Datos guardados correctamente', 'success');
        } else {
            showNotification('No hay datos para guardar', 'warning');
        }
    });

    container.appendChild(sendButton);
}

// Botón de debug con animación
function addDebugButton() {
    const container = document.querySelector('.button-row') || createButtonRow();

    const debugButton = document.createElement('button');
    debugButton.id = 'debugButton';
    debugButton.textContent = 'Modo Debug';
    debugButton.className = 'btn btn-secondary animated-btn';

    debugButton.addEventListener('click', () => {
        const debugMode = document.body.classList.toggle('debug-mode');
        showNotification(debugMode ? 'Modo debug activado' : 'Modo debug desactivado', 'info');
    });

    container.appendChild(debugButton);
}

// Crear fila de botones si no existe
function createButtonRow() {
    const newButtonRow = document.createElement('div');
    newButtonRow.className = 'button-row';
    newButtonRow.style.margin = '10px 0';
    document.body.appendChild(newButtonRow);
    return newButtonRow;
}

// Optimizar procesamiento de video con requestAnimationFrame
async function processVideoWithMediaPipe() {
    processedFrames = [];
    lastPoseLandmarks = null;

    videoElement.style.display = 'none';
    recordedVideoElement.style.display = 'none';
    canvasElement.style.display = 'block';

    const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
    });

    const canvasCtx = canvasElement.getContext('2d');
    const videoToProcess = recordedVideoElement;

    pose.onResults((results) => {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        if (results.poseLandmarks) {
            results.poseLandmarks.forEach((landmark, i) => {
                if (lastPoseLandmarks) {
                    landmark.x = lastPoseLandmarks[i].x * 0.8 + landmark.x * 0.2;
                    landmark.y = lastPoseLandmarks[i].y * 0.8 + landmark.y * 0.2;
                    landmark.z = lastPoseLandmarks[i].z * 0.8 + landmark.z * 0.2;
                }
            });

            lastPoseLandmarks = JSON.parse(JSON.stringify(results.poseLandmarks));

            results.poseLandmarks.forEach((landmark, index) => {
                if (landmark.visibility > 0.5) {
                    drawLandmark(canvasCtx, landmark, index);
                }
            });

            processedFrames.push({
                landmarks: results.poseLandmarks.map((landmark, index) => ({
                    index: index,
                    name: getLandmarkDetails(index)?.name || index.toString(),
                    x: landmark.x,
                    y: landmark.y,
                    z: landmark.z,
                    visibility: landmark.visibility
                })),
                timestamp: videoToProcess.currentTime
            });
        }
    });

    videoToProcess.loop = false;
    videoToProcess.play();
    await pose.initialize();

    function processFrame() {
        if (!videoToProcess.ended) {
            pose.send({ image: videoToProcess });
            requestAnimationFrame(processFrame);
        } else {
            showNotification('Procesamiento completado', 'success');
            updateLandmarkTable(processedFrames[processedFrames.length - 1]);
        }
    }

    requestAnimationFrame(processFrame);
}

// Dibujar landmark con animación
function drawLandmark(canvasCtx, landmark, index) {
    const x = landmark.x * canvasElement.width;
    const y = landmark.y * canvasElement.height;

    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 8, 0, 2 * Math.PI);
    canvasCtx.fillStyle = getLandmarkDetails(index)?.color || '#FF0000';
    canvasCtx.fill();

    canvasCtx.font = 'bold 14px Arial';
    canvasCtx.fillStyle = 'white';
    canvasCtx.fillText(index, x + 10, y);
}



// Asegúrate de que estás usando un canvas o un contenedor correcto para dibujar las líneas.
window.onload = function () {
    const canvas = document.getElementById("myCanvas");
    if (!canvas) {
        console.error("No se encontró el canvas. Asegúrate de tener un elemento <canvas> con id 'myCanvas' en tu HTML.");
        return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("No se pudo obtener el contexto 2D del canvas.");
        return;
    }

    // Ajustar el tamaño del canvas si es necesario
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Dibujar líneas
    function drawLine(x1, y1, x2, y2, color = "black", width = 2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    // Ejemplo de líneas dibujadas en el canvas
    drawLine(50, 50, 200, 50); // Línea horizontal
    drawLine(50, 50, 50, 200); // Línea vertical
    drawLine(50, 50, 200, 200, "red", 3); // Línea diagonal roja
};



document.addEventListener("DOMContentLoaded", function () {
    const filterContainer = document.getElementById("groupFilter");
    const colorLegend = document.getElementById("colorLegend");
    const tableBody = document.getElementById("tableBody");
    
    // Definimos los grupos de puntos de pose y sus colores
    const filters = [
        { name: "Cabeza", color: "#FF5733", points: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
        { name: "Tronco", color: "#33FF57", points: ["11", "12", "23", "24"] },
        { name: "Brazos", color: "#9D00FF", points: ["13", "14", "15", "16", "17", "18","19","20","21","22"] },
        { name: "Piernas", color: "#ffa400", points: ["25", "26", "27", "28", "29", "30", "31", "32"] }
    ];
    
    // Crear botones de filtro
    filters.forEach(filter => {
        const button = document.createElement("button");
        button.textContent = filter.name;
        button.classList.add("btn", "btn-filter");
        button.style.backgroundColor = filter.color;
        button.dataset.active = "true"; // Activado por defecto
        
        button.addEventListener("click", function () {
            const isActive = button.dataset.active === "true";
            button.dataset.active = isActive ? "false" : "true";
            button.style.opacity = isActive ? "0.5" : "1";
            toggleFilter(filter.points, !isActive);
        });
        
        filterContainer.appendChild(button);
    });
    
    // Crear leyenda de colores
    filters.forEach(filter => {
        const legendItem = document.createElement("div");
        legendItem.classList.add("legend-item");
        legendItem.innerHTML = `<span class="legend-color" style="background-color:${filter.color}"></span> ${filter.name}`;
        colorLegend.appendChild(legendItem);
    });
    
    // Función para alternar la visibilidad de los puntos y de la tabla
    function toggleFilter(points, isVisible) {
        points.forEach(point => {
            // Ocultar o mostrar puntos en la visualización
            const elements = document.querySelectorAll(`.pose-point[data-point='${point}']`);
            elements.forEach(el => {
                el.style.display = isVisible ? "block" : "none";
            });
            
            // Ocultar o mostrar filas en la tabla
            const rows = tableBody.querySelectorAll(`tr[data-point='${point}']`);
            rows.forEach(row => {
                row.style.display = isVisible ? "table-row" : "none";
            });
        });
    }
});
// Variables globales para los controles
let pointSize = 6;
let processingSpeed = 3; // Puede interpretarse como un factor para saltar frames
let showLabels = true;
let showConnections = true;
let showHoverInfo = true;

// Inicializar controles de la interfaz
function initializeControls() {
  const speedSlider = document.getElementById("speedSlider");
  const pointSizeSlider = document.getElementById("pointSizeSlider");
  const speedValue = document.getElementById("speedValue");
  const pointSizeValue = document.getElementById("pointSizeValue");
  const checkboxShowLabels = document.getElementById("showLabels");
  const checkboxShowConnections = document.getElementById("showConnections");
  const checkboxShowHoverInfo = document.getElementById("showHoverInfo");

  // Actualizar velocidad de procesamiento
  speedSlider.addEventListener("input", () => {
    processingSpeed = parseInt(speedSlider.value, 10);
    speedValue.textContent = processingSpeed;
    // Aquí puedes ajustar la lógica de procesamiento, por ejemplo,
    // saltar frames o modificar un delay entre frames.
  });

  // Actualizar tamaño de puntos
  pointSizeSlider.addEventListener("input", () => {
    pointSize = parseInt(pointSizeSlider.value, 10);
    pointSizeValue.textContent = pointSize + "px";
  });

  // Actualizar opciones de visualización
  checkboxShowLabels.addEventListener("change", () => {
    showLabels = checkboxShowLabels.checked;
  });
  checkboxShowConnections.addEventListener("change", () => {
    showConnections = checkboxShowConnections.checked;
  });
  checkboxShowHoverInfo.addEventListener("change", () => {
    showHoverInfo = checkboxShowHoverInfo.checked;
  });
}

// Ejemplo de función modificada para dibujar un landmark
function drawLandmark(canvasCtx, landmark, index) {
  const x = landmark.x * canvasElement.width;
  const y = landmark.y * canvasElement.height;

  // Dibujar el punto usando el tamaño definido por el slider
  canvasCtx.beginPath();
  canvasCtx.arc(x, y, pointSize, 0, 2 * Math.PI);
  canvasCtx.fillStyle = getLandmarkDetails(index)?.color || '#FF0000';
  canvasCtx.fill();

  // Dibujar la etiqueta si está activado
  if (showLabels) {
    canvasCtx.font = 'bold 14px Arial';
    canvasCtx.fillStyle = 'white';
    canvasCtx.fillText(index, x + 10, y);
  }
}

// Ejemplo de cómo modificar el dibujo de conexiones
function drawConnections(canvasCtx, poseLandmarks) {
  if (!showConnections) return;

  POSE_CONNECTIONS.forEach(connection => {
    const [start, end] = connection;
    const startLandmark = poseLandmarks[start];
    const endLandmark = poseLandmarks[end];

    if (startLandmark && endLandmark &&
        startLandmark.visibility > 0.5 && endLandmark.visibility > 0.5) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(startLandmark.x * canvasElement.width, startLandmark.y * canvasElement.height);
      canvasCtx.lineTo(endLandmark.x * canvasElement.width, endLandmark.y * canvasElement.height);
      canvasCtx.strokeStyle = '#000000'; // Línea negra
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
    }
  });
}

// Ejemplo de integración en el proceso de video (usando requestVideoFrameCallback)
async function processVideoWithMediaPipe() {
  processedFrames = [];
  lastPoseLandmarks = null;
  videoElement.style.display = 'none';
  recordedVideoElement.style.display = 'none';
  canvasElement.style.display = 'block';

  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: true,
    smoothSegmentation: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  const canvasCtx = canvasElement.getContext('2d');
  const videoToProcess = recordedVideoElement;

  pose.onResults((results) => {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
      // Aplicar suavizado (igual que antes)
      if (lastPoseLandmarks) {
        results.poseLandmarks.forEach((landmark, i) => {
          landmark.x = lastPoseLandmarks[i].x * 0.8 + landmark.x * 0.2;
          landmark.y = lastPoseLandmarks[i].y * 0.8 + landmark.y * 0.2;
          landmark.z = lastPoseLandmarks[i].z * 0.8 + landmark.z * 0.2;
        });
      }
      lastPoseLandmarks = JSON.parse(JSON.stringify(results.poseLandmarks));

      // Dibujar cada landmark usando la función modificada
      results.poseLandmarks.forEach((landmark, index) => {
        if (landmark.visibility > 0.5) {
          drawLandmark(canvasCtx, landmark, index);
          // Si se activa la info al pasar mouse, puedes agregar aquí listeners o lógica para mostrar datos.
          // Ejemplo (simplificado):
          if (showHoverInfo) {
            // Podrías asignar un tooltip o manejar el evento mousemove en el canvas.
          }
        }
      });

      // Dibujar conexiones
      drawConnections(canvasCtx, results.poseLandmarks);

      // Guardar frame procesado (igual que antes)
      processedFrames.push({
        landmarks: results.poseLandmarks.map((landmark, index) => ({
          index: index,
          name: getLandmarkDetails(index)?.name || index.toString(),
          x: landmark.x,
          y: landmark.y,
          z: landmark.z,
          visibility: landmark.visibility
        })),
        timestamp: videoToProcess.currentTime
      });
    }
  });

  videoToProcess.loop = false;
  videoToProcess.play();
  await pose.initialize();

  // Control de velocidad de procesamiento: saltar frames según el valor del slider
  let frameCount = 0;
  function processFrame() {
    frameCount++;
    // Solo procesamos cada "processingSpeed"-ésimo frame
    if (frameCount % processingSpeed === 0) {
      pose.send({ image: videoToProcess });
    }
    if (!videoToProcess.ended) {
      requestAnimationFrame(processFrame);
    } else {
      showNotification('Procesamiento completado', 'success');
      updateLandmarkTable(processedFrames[processedFrames.length - 1]);
    }
  }
  requestAnimationFrame(processFrame);
}

// Llamar a initializeControls() cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();      // Función existente para elementos DOM
  initializeControls();      // Nuevos controles de visualización
  setupEventListeners();     // Función existente para botones y cámara
});



// Botón para reiniciar el video y el procesamiento de MediaPipe
document.getElementById("resetVideoButton").addEventListener("click", () => {
    // Asegurarse de que el elemento de video grabado existe
    if (recordedVideoElement) {
      // Reiniciar el tiempo del video y reproducir desde el inicio
      recordedVideoElement.currentTime = 0;
      recordedVideoElement.play();
  
      // Limpiar los datos procesados si es necesario
      processedFrames = [];
      lastPoseLandmarks = null;
  
      // Reiniciar el procesamiento con MediaPipe
      // Esto puede ser tan simple como llamar nuevamente a la función de procesamiento.
      processVideoWithMediaPipe();
      
      console.log("Video reiniciado y procesamiento reanudado");
    } else {
      console.error("No se encontró el elemento de video para reiniciar");
    }
  });
  
function initializeControls() {
  // Obtenemos los elementos del DOM correspondientes a los controles:
  // - Slider de velocidad de procesamiento
  // - Slider del tamaño de puntos
  // - Checkbox para mostrar etiquetas, conexiones e info al pasar el mouse
  const speedSlider = document.getElementById("speedSlider");
  const pointSizeSlider = document.getElementById("pointSizeSlider");
  const speedValue = document.getElementById("speedValue");
  const pointSizeValue = document.getElementById("pointSizeValue");
  const checkboxShowLabels = document.getElementById("showLabels");
  const checkboxShowConnections = document.getElementById("showConnections");
  const checkboxShowHoverInfo = document.getElementById("showHoverInfo");

  // Establecer los valores iniciales en los controles
  speedSlider.value = processingSpeed;
  pointSizeSlider.value = pointSize;
  speedValue.textContent = processingSpeed;
  pointSizeValue.textContent = pointSize + "px";
  checkboxShowLabels.checked = showLabels;
  checkboxShowConnections.checked = showConnections;
  checkboxShowHoverInfo.checked = showHoverInfo;

  // Actualizar la velocidad de procesamiento al mover el slider
  speedSlider.addEventListener("input", () => {
    processingSpeed = parseInt(speedSlider.value, 10);
    speedValue.textContent = processingSpeed;
    // Aquí puedes incluir la lógica para ajustar el procesamiento (p. ej., saltar frames)
  });

  // Actualizar el tamaño de los puntos al mover el slider
  pointSizeSlider.addEventListener("input", () => {
    pointSize = parseInt(pointSizeSlider.value, 10);
    pointSizeValue.textContent = pointSize + "px";
    // Actualiza aquí el tamaño de los puntos en tu función de dibujo, por ejemplo, en drawLandmark()
  });

  // Actualizar la opción de mostrar etiquetas
  checkboxShowLabels.addEventListener("change", () => {
    showLabels = checkboxShowLabels.checked;
  });

  // Actualizar la opción de mostrar conexiones
  checkboxShowConnections.addEventListener("change", () => {
    showConnections = checkboxShowConnections.checked;
  });

  // Actualizar la opción de mostrar información al pasar el mouse
  checkboxShowHoverInfo.addEventListener("change", () => {
    showHoverInfo = checkboxShowHoverInfo.checked;
  });
}

// Llamada a la función al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  initializeControls();
});
function drawLandmark(canvasCtx, landmark, index) {
    const x = landmark.x * canvasElement.width;
    const y = landmark.y * canvasElement.height;
  
    // Dibujar el punto con el tamaño definido
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, pointSize, 0, 2 * Math.PI);
    canvasCtx.fillStyle = getLandmarkDetails(index)?.color || '#FF0000';
    canvasCtx.fill();
  
    // Mostrar la etiqueta si está activado
    if (showLabels) {
      canvasCtx.font = 'bold 14px Arial';
      canvasCtx.fillStyle = 'white';
      canvasCtx.fillText(index, x + 10, y);
    }
  }
  
  // Función para exportar la tabla a CSV
function exportTableToCSV(filename = 'datos_puntos_pose.csv') {
    const csv = [];
    const table = document.getElementById('dataTable');
    const rows = table.querySelectorAll('tr');
  
    // Recorre cada fila de la tabla
    rows.forEach(row => {
      const cols = row.querySelectorAll('td, th');
      const rowData = [];
      cols.forEach(col => {
        // Escapar comillas y envolver cada valor entre comillas
        rowData.push('"' + col.innerText.replace(/"/g, '""') + '"');
      });
      csv.push(rowData.join(','));
    });
  
    // Une las filas con saltos de línea
    const csvString = csv.join('\n');
    
    // Crear un blob con el contenido CSV y generar el enlace de descarga
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // Asignar el evento de clic al botón de exportación
  document.addEventListener("DOMContentLoaded", () => {
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
      exportButton.addEventListener('click', exportTableToCSV);
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    const exportButton = document.getElementById("exportButton");
    let mediaPipeData = []; // Aquí se almacenarán todos los frames
  
    // Simulación de datos de MediaPipe (reemplázalo con tus datos reales)
    function loadMediaPipeData(totalFrames) {
      for (let i = 0; i < totalFrames; i++) {
        mediaPipeData[i] = generateFakeLandmarkData(i);
      }
    }
  
    function generateFakeLandmarkData(frameNumber) {
      return [
        { frame: frameNumber, id: 0, x: Math.random().toFixed(3), y: Math.random().toFixed(3), z: Math.random().toFixed(3) },
        { frame: frameNumber, id: 1, x: Math.random().toFixed(3), y: Math.random().toFixed(3), z: Math.random().toFixed(3) },
        { frame: frameNumber, id: 2, x: Math.random().toFixed(3), y: Math.random().toFixed(3), z: Math.random().toFixed(3) },
      ];
    }
  
    // Simulación de carga inicial (esto debe cambiarse por la captura real de MediaPipe)
    let totalFrames = 100; // Ajusta según la cantidad real de frames
    loadMediaPipeData(totalFrames);
  
    // Habilitar el botón de exportar
    exportButton.disabled = false;
  
    // Función para exportar todos los datos de MediaPipe a CSV
    function exportAllMediaPipeDataToCSV(filename = "datos_media_pipe.csv") {
      if (mediaPipeData.length === 0) {
        alert("No hay datos para exportar.");
        return;
      }
  
      const csv = [];
      csv.push("Frame,ID,X,Y,Z"); // Cabecera del CSV
  
      mediaPipeData.forEach((frameData) => {
        frameData.forEach((landmark) => {
          csv.push(`${landmark.frame},${landmark.id},${landmark.x},${landmark.y},${landmark.z}`);
        });
      });
  
      const csvString = csv.join("\n");
  
      // Crear un blob con el contenido CSV y generar el enlace de descarga
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  
    // Configurar el botón de exportación para activar la función
    exportButton.addEventListener("click", exportAllMediaPipeDataToCSV);
  });
  
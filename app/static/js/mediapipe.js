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
    LEFT_SHOULDER: { index: 11, name: '11', color: '#FF0000' },
    RIGHT_SHOULDER: { index: 12, name: '12', color: '#00FF00' },
    LEFT_ELBOW: { index: 13, name: '13', color: '#FF0000' },
    RIGHT_ELBOW: { index: 14, name: '14', color: '#00FF00' },
    LEFT_WRIST: { index: 15, name: '15', color: '#FF0000' },
    RIGHT_WRIST: { index: 16, name: '16', color: '#00FF00' },
    
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
    RIGHT_ANKLE: { index: 28, name: '28', color: '#800080' },
    
    // Feet
    LEFT_HEEL: { index: 29, name: '29', color: '#FFA500' },
    RIGHT_HEEL: { index: 30, name: '30', color: '#800080' },
    LEFT_FOOT_INDEX: { index: 31, name: '31', color: '#FFA500' },
    RIGHT_FOOT_INDEX: { index: 32, name: '32', color: '#800080' }
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
    
    // Si la tabla no existe, créala
    if (!tableBody) {
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
        
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        tableContainer.style.marginTop = '20px';
        tableContainer.appendChild(table);
        
        document.body.appendChild(tableContainer);
        tableBody = document.getElementById('tableBody');
    }
    
    tableBody.innerHTML = ''; // Clear previous data

    if (processedFrame && processedFrame.landmarks) {
        processedFrame.landmarks.forEach(landmark => {
            const row = document.createElement('tr');
            // Destacar filas con baja visibilidad
            if (landmark.visibility < 0.5) {
                row.classList.add('table-warning');
            }
            row.innerHTML = `
                <td>${landmark.index}</td>
                <td>${landmark.name}</td>
                <td><div style="background-color:${getLandmarkDetails(landmark.index)?.color || '#000000'}; width:20px; height:20px;"></div></td>
                <td>${(landmark.x * 100).toFixed(2)}%</td>
                <td>${(landmark.y * 100).toFixed(2)}%</td>
                <td>${landmark.visibility.toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
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

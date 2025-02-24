// Obtener referencias a elementos
const openModalBtn = document.getElementById('openModalBtn');
const modal = document.getElementById('addPatientModal');
const closeModalBtn = document.querySelector('.close-modal-btn');
const addPatientForm = document.getElementById('addPatientForm');
const successAlert = document.getElementById('successAlert');
const patientsList = document.querySelector('.patients-list');

// Abrir modal
openModalBtn.addEventListener('click', function() {
    modal.style.display = 'flex';
});

// Cerrar modal con el botón X
closeModalBtn.addEventListener('click', function() {
    modal.style.display = 'none';
});

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', function(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Manejar el envío del formulario
addPatientForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Obtener valores del formulario
    const nombre = this.elements[0].value;
    const primerApellido = this.elements[1].value;
    const segundoApellido = this.elements[2].value;
    
    // Crear nueva tarjeta de paciente
    const newPatientCard = document.createElement('div');
    newPatientCard.className = 'patient-card';
    newPatientCard.innerHTML = `
        <i class="fas fa-user-circle"></i>
        <span><strong>${nombre} ${primerApellido} ${segundoApellido}</strong></span>
        <span class="code">Código:</span>
        <button class="enter-btn"><i class="fas fa-arrow-right"></i></button>
    `;
    
    // Añadir la nueva tarjeta a la lista
    patientsList.appendChild(newPatientCard);
    
    // Mostrar alerta de éxito
    successAlert.classList.add('show');
    
    // Ocultar la alerta después de 3 segundos
    setTimeout(function() {
        successAlert.classList.remove('show');
    }, 3000);
    
    // Cerrar modal y resetear formulario
    modal.style.display = 'none';
    this.reset();
});

// Cargar script externo si existe
const scriptElement = document.createElement('script');
scriptElement.src = 'principal.js';
scriptElement.onerror = function() {
    console.log('No se pudo cargar el archivo principal.js');
};
document.body.appendChild(scriptElement);
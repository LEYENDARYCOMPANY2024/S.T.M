  // Script para calcular el IMC
  document.getElementById('peso').addEventListener('input', calcularIMC);
  document.getElementById('estatura').addEventListener('input', calcularIMC);
  
  function calcularIMC() {
      const peso = parseFloat(document.getElementById('peso').value);
      const estatura = parseFloat(document.getElementById('estatura').value);
      
      if (peso > 0 && estatura > 0) {
          // Convertir estatura de cm a metros
          const estaturaMetros = estatura / 100;
          const imc = (peso / (estaturaMetros * estaturaMetros)).toFixed(1);
          document.getElementById('imc').value = imc;
      }
  }
 
// Función para configurar todos los campos condicionales
function configurarCamposCondicionales() {
    // Lista de todas las condiciones médicas que tienen opción Sí/No
    const condiciones = [
      'diabetes',
      'alergia',
      'hta',
      'cancer',
      'transfusiones',
      'reumaticas',
      'fracturas'
    ];
    
    // Para cada condición, configuramos el comportamiento
    condiciones.forEach(condicion => {
      // Obtenemos referencias a los elementos
      const radioSi = document.getElementById(`${condicion}Si`);
      const radioNo = document.getElementById(`${condicion}No`);
      
      // El campo de texto será el input que está en el mismo contenedor
      // Se encuentra el div padre y luego el input de texto dentro
      const contenedor = radioSi.closest('.inline-field');
      const campoTexto = contenedor.querySelector('input[type="text"]');
      
      // Función para actualizar el estado del campo de texto
      function actualizarCampoTexto() {
        // Si "Sí" está seleccionado, habilitamos el campo de texto
        if (radioSi.checked) {
          campoTexto.disabled = false;
          campoTexto.placeholder = "Especifique";
        } 
        // Si "No" está seleccionado, deshabilitamos y limpiamos el campo
        else if (radioNo.checked) {
          campoTexto.disabled = true;
          campoTexto.value = "";
          campoTexto.placeholder = "No aplica";
        }
      }
      
      // Configuramos los event listeners para los radio buttons
      radioSi.addEventListener('change', actualizarCampoTexto);
      radioNo.addEventListener('change', actualizarCampoTexto);
      
      // Inicializamos el estado (por defecto los campos estarán deshabilitados)
      // hasta que el usuario seleccione una opción
      campoTexto.disabled = true;
    });
  }
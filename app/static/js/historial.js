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

  
// Ejecutar la configuración cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    configurarCamposCondicionales();
    
    // También podemos añadir una validación al formulario
    const formulario = document.querySelector('form');
    if (formulario) {
      formulario.addEventListener('submit', function(event) {
        // Verificar que todos los campos con "Sí" seleccionado tengan texto
        const condiciones = [
          'diabetes',
          'alergia',
          'hta',
          'cancer',
          'transfusiones',
          'reumaticas',
          'fracturas'
        ];
        
        let formularioValido = true;
        
        condiciones.forEach(condicion => {
          const radioSi = document.getElementById(`${condicion}Si`);
          const contenedor = radioSi.closest('.inline-field');
          const campoTexto = contenedor.querySelector('input[type="text"]');
          
          // Si se seleccionó "Sí" pero no se especificó detalles
          if (radioSi.checked && campoTexto.value.trim() === '') {
            alert(`Por favor especifique detalles para ${condicion}.`);
            formularioValido = false;
          }
        });
        
        if (!formularioValido) {
          event.preventDefault(); // Evitar que se envíe el formulario
        }
      });
    }
  });
  

// Función para configurar el campo de Espasmos
document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos
    const radioSi = document.getElementById('espasmosSi');
    const radioNo = document.getElementById('espasmosNo');
    const campoTexto = document.getElementById('sitioEspasmos');
    
    // Función para actualizar el estado del campo de texto
    function actualizarCampoTexto() {
      // Si "Sí" está seleccionado, habilitamos el campo de texto
      if (radioSi.checked) {
        campoTexto.disabled = false;
        campoTexto.placeholder = "Indique sitio y características";
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
    
    // Estado inicial - Verificamos si ya hay algo seleccionado
    if (radioSi.checked) {
      campoTexto.disabled = false;
    } else if (radioNo.checked) {
      campoTexto.disabled = true;
      campoTexto.value = "";
    } else {
      // Si ninguno está seleccionado inicialmente, deshabilitamos el campo
      campoTexto.disabled = true;
    }
  });
  

  
// Función para configurar los campos de Hábitos de Salud
document.addEventListener('DOMContentLoaded', function() {
    // Lista de hábitos que tienen opción Sí/No
    const habitos = [
      'tabaquismo',
      'alcoholismo',
      'drogas',
      'actividadFisica',
      'automedica'
    ];
    
    // Para cada hábito, configuramos el comportamiento
    habitos.forEach(habito => {
      // Obtenemos referencias a los elementos
      const radioSi = document.getElementById(`${habito}Si`);
      const radioNo = document.getElementById(`${habito}No`);
      
      // Verificar que existan los elementos
      if (!radioSi || !radioNo) return;
      
      // El campo de texto será el input que está en el mismo contenedor
      const contenedor = radioSi.closest('.inline-field');
      const campoTexto = contenedor.querySelector('input[type="text"]');
      
      if (!campoTexto) return;
      
      // Función para actualizar el estado del campo de texto
      function actualizarCampoTexto() {
        // Si "Sí" está seleccionado, habilitamos el campo de texto
        if (radioSi.checked) {
          campoTexto.disabled = false;
          
          // Placeholders personalizados según el tipo de hábito
          if (habito === 'tabaquismo') {
            campoTexto.placeholder = "Cantidad/frecuencia (cigarrillos por día)";
          } else if (habito === 'alcoholismo') {
            campoTexto.placeholder = "Tipo y frecuencia de consumo";
          } else if (habito === 'drogas') {
            campoTexto.placeholder = "Tipo y frecuencia de consumo";
          } else if (habito === 'actividadFisica') {
            campoTexto.placeholder = "Tipo de actividad y frecuencia";
          } else if (habito === 'automedica') {
            campoTexto.placeholder = "Medicamentos que consume";
          } else {
            campoTexto.placeholder = "Especifique";
          }
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
    
    // Inicializamos el estado basado en la selección actual
    if (radioSi.checked) {
      campoTexto.disabled = false;
    } else if (radioNo.checked) {
      campoTexto.disabled = true;
      campoTexto.value = "";
    } else {
      // Por defecto, si ninguno está seleccionado
      campoTexto.disabled = true;
    }
  });
});
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
 
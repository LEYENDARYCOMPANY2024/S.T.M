document.addEventListener("DOMContentLoaded", function() {
    // Animación original para las letras S.M.M.
    const smm = document.querySelector(".smm");
    smm.addEventListener("mouseover", function() {
        let colors = [
            "#FFD700", // Dorado
            "#C0C0C0", // Plateado
            "#CD7F32", // Bronce
            "#B8860B", // Oro viejo
            "#E5E4E2", // Platino
            "#B87333", // Cobre
            "#B76E79"  // Oro rosa
          ];
          
        let i = 0;
        let interval = setInterval(() => {
            smm.style.webkitTextStrokeColor = colors[i];
            i = (i + 1) % colors.length;
        }, 200);
        smm.addEventListener("mouseleave", function() {
            clearInterval(interval);
            smm.style.webkitTextStrokeColor = "white";
        }, { once: true });
    });
    
    // Añadir partículas flotantes
    const particles = document.querySelector(".particles");
    for (let i = 0; i < 20; i++) {
        createParticle();
    }
    
    function createParticle() {
        const particle = document.createElement("span");
        particle.className = "particle";
        
        // Posición aleatoria
        const posX = Math.random() * 100;
        const posY = Math.random() * 100 + 100; // Empieza debajo de la pantalla
        
        // Tamaño aleatorio
        const size = Math.random() * 10 + 5;
        
        // Duración aleatoria
        const duration = Math.random() * 15 + 10;
        
        // Aplicar estilos
        particle.style.left = `${posX}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = `${Math.random() * 0.5 + 0.5}`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        
        particles.appendChild(particle);
        
        // Eliminar la partícula después de que termine la animación
        setTimeout(() => {
            particle.remove();
            createParticle();
        }, duration * 1000);
    }
    
    // Efecto 3D en hover para cada letra
    const letras = document.querySelectorAll(".smm span");
    letras.forEach(letra => {
        letra.addEventListener("mouseover", function() {
            this.style.transform = `rotateY(${Math.random() * 40 - 20}deg) rotateX(${Math.random() * 40 - 20}deg) scale(1.2)`;
            this.style.transition = "transform 0.3s ease";
        });
        
        letra.addEventListener("mouseleave", function() {
            this.style.transform = "rotateY(0) rotateX(0) scale(1)";
        });
    });
});

// Agregar estilos CSS dinámicamente
let lastScrollTop = 0;
window.addEventListener("scroll", function () {
    let scrollMessage = document.getElementById("scroll-message");
    let currentScroll = window.scrollY;

    if (currentScroll > lastScrollTop) {
        // Usuario baja
        scrollMessage.classList.add("visible");
    } else {
        // Usuario sube
        scrollMessage.classList.remove("visible");
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});

window.addEventListener("scroll", function () {
    let bell = document.getElementById("floating-bell");
    if (window.scrollY > 300) {
        bell.style.display = "block";
    } else {
        bell.style.display = "none";
    }
});

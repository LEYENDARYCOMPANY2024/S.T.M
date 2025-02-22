document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-inicio');
    
    // Agregar clases para los efectos iniciales
    btn.classList.add('glow', 'fade-in');
    
    // Efecto de pulso al cargar la página
    setTimeout(() => {
        btn.classList.add('pulse');
    }, 1000);
    
    // Efecto de click
    btn.addEventListener('click', (event) => {
        btn.classList.remove('pulse', 'glow');
        
        // Efecto de "ripple" al hacer click
        const ripple = document.createElement('div');
        ripple.classList.add('ripple-effect');
        
        const rect = btn.getBoundingClientRect();
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        
        btn.appendChild(ripple);
        
        // Eliminar el efecto después de la animación
        setTimeout(() => {
            ripple.remove();
            btn.classList.add('pulse', 'glow');
        }, 600);
    });
});

// Agregar estilos CSS dinámicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        from {
            transform: scale(0);
            opacity: 1;
        }
        to {
            transform: scale(20);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    @keyframes glow {
        0% { box-shadow: 0 0 5px #ff00ff; }
        50% { box-shadow: 0 0 20px #ff00ff; }
        100% { box-shadow: 0 0 5px #ff00ff; }
    }
    
    .pulse {
        animation: pulse 1.5s infinite;
    }
    
    .glow {
        animation: glow 1.5s infinite alternate;
    }
    
    .fade-in {
        animation: fade-in 1s ease-in-out;
    }
    
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.7);
        width: 40px;
        height: 40px;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }
    
    section {
        opacity: 0;
        transform: translateY(50px);
        transition: opacity 1s ease-out, transform 1s ease-out;
    }
    
    .visible {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", function () {
    const sections = document.querySelectorAll("section");

    function mostrarSecciones() {
        sections.forEach((section) => {
            const sectionTop = section.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (sectionTop < windowHeight - 100) {
                section.classList.add("visible");
            }
        });
    }

    window.addEventListener("scroll", mostrarSecciones);
    mostrarSecciones(); // Mostrar las secciones visibles al cargar la página
});


document.addEventListener("DOMContentLoaded", function () {
    const separators = document.querySelectorAll(".section-separator");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, { threshold: 0.5 });

    separators.forEach((separator) => {
        observer.observe(separator);
    });
});

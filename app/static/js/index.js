document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("session_token");

    // 📌 Si el usuario ya tiene sesión, redirigir a principal sin mostrar la página
    if (token) {
        window.location.replace("/principal"); // 🔹 Redirige sin dejar historial (evita botón "atrás")
        return;
    }

    // 📌 Si no hay sesión, mostrar la página eliminando la clase "hidden"
    document.body.classList.remove("hidden");

    // 📌 Manejar el botón "Inicio" para redirigir según sesión activa
    const inicioBtn = document.getElementById("inicioBtn");
    if (inicioBtn) {
        inicioBtn.addEventListener("click", function (event) {
            event.preventDefault(); // Evita la recarga de la página

            if (localStorage.getItem("session_token")) {
                window.location.href = "/principal"; // 🔹 Si hay sesión, ir a principal
            } else {
                window.location.href = "/login"; // 🔹 Si no hay sesión, ir a login
            }
        });
    }

    // 📌 Animación de las letras "S.M.M."
    const smm = document.querySelector(".smm");
    if (smm) {
        smm.addEventListener("mouseover", function () {
            let colors = ["#FFD700", "#C0C0C0", "#CD7F32", "#B8860B", "#E5E4E2", "#B87333", "#B76E79"];
            let i = 0;
            let interval = setInterval(() => {
                smm.style.webkitTextStrokeColor = colors[i];
                i = (i + 1) % colors.length;
            }, 200);

            smm.addEventListener("mouseleave", function () {
                clearInterval(interval);
                smm.style.webkitTextStrokeColor = "white";
            }, { once: true });
        });

        // 📌 Efecto 3D en hover para cada letra
        const letras = document.querySelectorAll(".smm span");
        letras.forEach(letra => {
            letra.addEventListener("mouseover", function () {
                this.style.transform = `rotateY(${Math.random() * 40 - 20}deg) rotateX(${Math.random() * 40 - 20}deg) scale(1.2)`;
                this.style.transition = "transform 0.3s ease";
            });

            letra.addEventListener("mouseleave", function () {
                this.style.transform = "rotateY(0) rotateX(0) scale(1)";
            });
        });
    }

    // 📌 Añadir partículas flotantes
    const particles = document.querySelector(".particles");
    if (particles) {
        for (let i = 0; i < 20; i++) {
            createParticle();
        }
    }

    function createParticle() {
        const particle = document.createElement("span");
        particle.className = "particle";

        // Posición y tamaño aleatorio
        const posX = Math.random() * 100;
        const size = Math.random() * 10 + 5;
        const duration = Math.random() * 15 + 10;

        // Aplicar estilos
        particle.style.left = `${posX}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = `${Math.random() * 0.5 + 0.5}`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;

        particles.appendChild(particle);

        // Eliminar la partícula después de la animación
        setTimeout(() => {
            particle.remove();
            createParticle();
        }, duration * 1000);
    }

    // 📌 Manejo de scroll para mostrar elementos dinámicamente
    let lastScrollTop = 0;
    window.addEventListener("scroll", function () {
        let scrollMessage = document.getElementById("scroll-message");
        let currentScroll = window.scrollY;

        if (scrollMessage) {
            if (currentScroll > lastScrollTop) {
                scrollMessage.classList.add("visible");
            } else {
                scrollMessage.classList.remove("visible");
            }
        }

        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });

    window.addEventListener("scroll", function () {
        let bell = document.getElementById("floating-bell");
        if (bell) {
            bell.style.display = window.scrollY > 300 ? "block" : "none";
        }
    });
});

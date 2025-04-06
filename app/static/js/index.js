document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem("session_token");

    // Redirigir a principal si el usuario ya tiene sesión
    if (token) {
        window.location.replace("/principal");
        return;
    }

    document.body.classList.remove("hidden");

    // Botón de "Comenzar" que redirige a login si no hay sesión
    const inicioBtn = document.getElementById("inicioBtn");
    if (inicioBtn) {
        inicioBtn.addEventListener("click", function (event) {
            event.preventDefault();
            if (localStorage.getItem("session_token")) {
                window.location.href = "/principal";
            } else {
                window.location.href = "/login"; // Redirección a login
            }
        });
    }

    // Preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', function() {
            preloader.classList.add('fade-out');
            setTimeout(() => preloader.style.display = 'none', 1000);
        });
    }

    // Menú de navegación móvil
    const menuToggle = document.getElementById('menu-toggle');
    const mainMenu = document.getElementById('main-menu');
    
    if (menuToggle && mainMenu) {
        menuToggle.addEventListener('click', function() {
            const expanded = this.getAttribute('aria-expanded') === 'true' || false;
            this.setAttribute('aria-expanded', !expanded);
            mainMenu.classList.toggle('active');
            this.classList.toggle('active');
        });

        mainMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                mainMenu.classList.remove('active');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Animaciones de letras "S.M.M."
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

    // Partículas flotantes
    const particles = document.querySelector(".particles");
    if (particles) {
        for (let i = 0; i < 20; i++) createParticle();
    }

    function createParticle() {
        const particle = document.createElement("span");
        particle.className = "particle";
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.width = `${Math.random() * 10 + 5}px`;
        particle.style.height = `${Math.random() * 10 + 5}px`;
        particle.style.opacity = `${Math.random() * 0.5 + 0.5}`;
        particle.style.animationDuration = `${Math.random() * 15 + 10}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particles.appendChild(particle);

        setTimeout(() => {
            particle.remove();
            createParticle();
        }, parseFloat(particle.style.animationDuration) * 1000);
    }

    // Botón de volver arriba
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        window.addEventListener('scroll', function() {
            backToTopButton.classList.toggle('visible', window.pageYOffset > 300);
        });

        backToTopButton.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Efecto de revelar elementos al hacer scroll
    function revealOnScroll() {
        document.querySelectorAll('.section').forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            if (sectionTop < window.innerHeight - 100) section.classList.add('revealed');
        });
    }
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    // Manejo de notificaciones flotantes en scroll
    window.addEventListener("scroll", function () {
        let bell = document.getElementById("floating-bell");
        if (bell) {
            bell.style.display = window.scrollY > 300 ? "block" : "none";
        }
    });

    // Cookies banner
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptCookiesButton = document.getElementById('accept-cookies');
    const declineCookiesButton = document.getElementById('decline-cookies');

    if (cookieBanner && acceptCookiesButton && declineCookiesButton) {
        if (!localStorage.getItem('cookieChoice')) {
            cookieBanner.classList.add('active');
        }

        acceptCookiesButton.addEventListener('click', function() {
            localStorage.setItem('cookieChoice', 'accepted');
            cookieBanner.classList.remove('active');
        });

        declineCookiesButton.addEventListener('click', function() {
            localStorage.setItem('cookieChoice', 'declined');
            cookieBanner.classList.remove('active');
        });
    }

    // Sticky Header
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', function() {
            header.classList.toggle('sticky', window.pageYOffset > 100);
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    // Preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', function() {
            preloader.classList.add('fade-out');
            setTimeout(function() {
                preloader.style.display = 'none';
            }, 1000);
        });
    }

    // Mobile Navigation Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mainMenu = document.getElementById('main-menu');
    
    if (menuToggle && mainMenu) {
        menuToggle.addEventListener('click', function() {
            const expanded = this.getAttribute('aria-expanded') === 'true' || false;
            this.setAttribute('aria-expanded', !expanded);
            mainMenu.classList.toggle('active');
            this.classList.toggle('active');
        });

        // Close menu when clicking on links
        const menuLinks = mainMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                mainMenu.classList.remove('active');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offset = 80; // Adjust for fixed header
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Back to top button
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });

        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Accessibility widget
    const accessibilityToggle = document.getElementById('accessibility-toggle');
    const accessibilityMenu = document.getElementById('accessibility-menu');
    const increaseTextButton = document.getElementById('increase-text');
    const decreaseTextButton = document.getElementById('decrease-text');
    const toggleContrastButton = document.getElementById('toggle-contrast');
    
    if (accessibilityToggle && accessibilityMenu) {
        accessibilityToggle.addEventListener('click', function() {
            accessibilityMenu.classList.toggle('open');
        });
        
        // Click outside to close
        document.addEventListener('click', function(event) {
            if (!accessibilityMenu.contains(event.target) && accessibilityMenu.classList.contains('open')) {
                accessibilityMenu.classList.remove('open');
            }
        });

        // Font size adjustment
        let currentFontSize = 100;
        const minFontSize = 80;
        const maxFontSize = 150;
        const fontSizeStep = 10;
        
        if (increaseTextButton) {
            increaseTextButton.addEventListener('click', function() {
                if (currentFontSize < maxFontSize) {
                    currentFontSize += fontSizeStep;
                    document.body.style.fontSize = currentFontSize + '%';
                    localStorage.setItem('fontSize', currentFontSize);
                }
            });
        }
        
        if (decreaseTextButton) {
            decreaseTextButton.addEventListener('click', function() {
                if (currentFontSize > minFontSize) {
                    currentFontSize -= fontSizeStep;
                    document.body.style.fontSize = currentFontSize + '%';
                    localStorage.setItem('fontSize', currentFontSize);
                }
            });
        }
        
        // Load saved font size
        const savedFontSize = localStorage.getItem('fontSize');
        if (savedFontSize) {
            currentFontSize = parseInt(savedFontSize);
            document.body.style.fontSize = currentFontSize + '%';
        }
        
        // High contrast mode
        if (toggleContrastButton) {
            toggleContrastButton.addEventListener('click', function() {
                document.body.classList.toggle('high-contrast');
                const isHighContrast = document.body.classList.contains('high-contrast');
                localStorage.setItem('highContrast', isHighContrast);
            });
            
            // Load saved contrast setting
            const savedContrast = localStorage.getItem('highContrast');
            if (savedContrast === 'true') {
                document.body.classList.add('high-contrast');
            }
        }
    }

    // Accordion functionality
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const accordionItem = this.parentElement;
            const accordionContent = this.nextElementSibling;
            
            // Toggle the current accordion item
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            
            if (isExpanded) {
                accordionContent.style.maxHeight = null;
                this.querySelector('.accordion-icon').textContent = '+';
            } else {
                accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
                this.querySelector('.accordion-icon').textContent = '-';
            }
        });
    });

    // Testimonial slider
    const testimonials = document.querySelectorAll('.testimonial');
<<<<<<< HEAD
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    
    if (testimonials.length > 0 && dots.length > 0) {
        function showSlide(index) {
            testimonials.forEach((testimonial, i) => {
                testimonial.style.display = i === index ? 'block' : 'none';
            });
            
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
            
            currentSlide = index;
        }
        
        // Initialize slider
        showSlide(0);
        
        // Add click event to dots
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => showSlide(i));
        });
        
        // Auto-slide functionality
        function autoSlide() {
            const nextSlide = (currentSlide + 1) % testimonials.length;
            showSlide(nextSlide);
        }
        
        // Change slides every 5 seconds
        const slideInterval = setInterval(autoSlide, 5000);
        
        // Pause auto-slide on hover
        const testimonialsContainer = document.querySelector('.testimonials-slider');
        if (testimonialsContainer) {
            testimonialsContainer.addEventListener('mouseenter', () => {
                clearInterval(slideInterval);
            });
            
            testimonialsContainer.addEventListener('mouseleave', () => {
                setInterval(autoSlide, 5000);
            });
        }
    }

=======
    const dotsContainer = document.querySelector('.pagination-dots');
    let currentSlide = 0;
    let slideInterval = null;

    function showSlide(index) {
        const dots = document.querySelectorAll('.dot');

        testimonials.forEach((testimonial, i) => {
            testimonial.style.display = i === index ? 'block' : 'none';
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        currentSlide = index;
    }

    function startAutoSlide() {
        clearInterval(slideInterval); // Previene múltiples intervalos
        slideInterval = setInterval(() => {
            const nextSlide = (currentSlide + 1) % testimonials.length;
            showSlide(nextSlide);
        }, 5000);
    }

    if (testimonials.length > 0 && dotsContainer) {
        // Limpiar y generar dots según testimonios
        dotsContainer.innerHTML = '';
        testimonials.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');

            dot.addEventListener('click', () => {
                showSlide(index);
                startAutoSlide(); // Reinicia correctamente
            });

            dotsContainer.appendChild(dot);
        });

        showSlide(0);         // Mostrar el primero
        startAutoSlide();     // Iniciar autoplay correctamente

        const slider = document.querySelector('.testimonials-slider');
        if (slider) {
            slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
            slider.addEventListener('mouseleave', startAutoSlide);
        }
    }

    

>>>>>>> pruebas
    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // Here you would typically send the data to a server
            // For demo purposes, just show an alert
            alert(`Gracias ${name} por tu mensaje. Te responderemos a ${email} lo antes posible.`);
            
            // Reset form
            contactForm.reset();
        });
    }

    // Cookie consent banner
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptCookiesButton = document.getElementById('accept-cookies');
    const declineCookiesButton = document.getElementById('decline-cookies');
    
    if (cookieBanner && acceptCookiesButton && declineCookiesButton) {
        // Check if user has already made a choice
        const cookieChoice = localStorage.getItem('cookieChoice');
        
        if (!cookieChoice) {
            // Show the banner if no choice has been made
            cookieBanner.classList.add('active');
        }
        
        acceptCookiesButton.addEventListener('click', function() {
            localStorage.setItem('cookieChoice', 'accepted');
            cookieBanner.classList.remove('active');
            // Here you would enable any cookie-dependent features
        });
        
        declineCookiesButton.addEventListener('click', function() {
            localStorage.setItem('cookieChoice', 'declined');
            cookieBanner.classList.remove('active');
            // Here you would ensure cookies are not used
        });
    }

    // Animated elements on scroll
    function revealOnScroll() {
        const sections = document.querySelectorAll('.section');
        
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (sectionTop < windowHeight - 100) {
                section.classList.add('revealed');
            }
        });
    }
    
    // Initial check on page load
    revealOnScroll();
    
    // Check on scroll
    window.addEventListener('scroll', revealOnScroll);

    // Particles background animation
    function createParticles() {
        const particlesContainer = document.querySelector('.particles');
        if (!particlesContainer) return;
        
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Random properties
            const size = Math.random() * 5 + 1;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 5;
            
            // Apply styles
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = posX + '%';
            particle.style.top = posY + '%';
            particle.style.animationDuration = duration + 's';
            particle.style.animationDelay = delay + 's';
            
            particlesContainer.appendChild(particle);
        }
    }
    
    createParticles();

    // Call to Action button animation
    const ctaButton = document.getElementById('btn-inicio');
    
    if (ctaButton) {
        ctaButton.addEventListener('mouseenter', function() {
            this.classList.add('pulse');
        });
        
        ctaButton.addEventListener('mouseleave', function() {
            this.classList.remove('pulse');
        });
        
        ctaButton.addEventListener('click', function() {
            // Scroll to services section when CTA button is clicked
            const servicesSection = document.getElementById('servicios');
            if (servicesSection) {
                const offset = 80; // Adjust for fixed header
                const targetPosition = servicesSection.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Add animation for S.M.M. letters in hero
    const smmLetters = document.querySelectorAll('.smm span');
    
    if (smmLetters.length > 0) {
        smmLetters.forEach((letter, index) => {
            letter.style.animationDelay = (index * 0.2) + 's';
        });
    }

    // Sticky header on scroll
    const header = document.querySelector('header');
    
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 100) {
                header.classList.add('sticky');
            } else {
                header.classList.remove('sticky');
            }
        });
    }
});

/* JavaScript mejorado */
document.addEventListener('DOMContentLoaded', function() {
    const smmContainer = document.querySelector('.smm');
    const letters = document.querySelectorAll('.smm span:not(.punto)');
    
    // Añadir atributo data-letter a cada letra para el efecto de sombra
    letters.forEach(letter => {
      letter.setAttribute('data-letter', letter.textContent);
    });
    
    // Mover letras individualmente al mover el mouse
    smmContainer.addEventListener('mousemove', function(e) {
      const { left, top, width, height } = this.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      
      const letters = document.querySelectorAll('.smm span');
      letters.forEach(letter => {
        const factor = letter.classList.contains('punto') ? 30 : 20;
        letter.style.transform = `perspective(500px) 
                                rotateY(${x * factor}deg) 
                                rotateX(${-y * factor}deg)
                                translateZ(10px)`;
      });
    });
    
    smmContainer.addEventListener('mouseleave', function() {
      const letters = document.querySelectorAll('.smm span');
      letters.forEach(letter => {
        letter.style.transform = 'perspective(500px) rotateY(0) rotateX(0) translateZ(0)';
        if (letter.classList.contains('punto')) {
          letter.style.animation = 'float 3s ease-in-out infinite';
        }
      });
    });
    
    // Efecto al hacer clic
    smmContainer.addEventListener('click', function() {
      const letters = document.querySelectorAll('.smm span');
      
      letters.forEach((letter, index) => {
        letter.style.animation = '';
        setTimeout(() => {
          letter.style.transform = 'scale(0.8) translateY(20px)';
          letter.style.opacity = '0.5';
          
          setTimeout(() => {
            letter.style.transform = 'scale(1.2) translateY(-20px)';
            letter.style.opacity = '1';
            
            setTimeout(() => {
              letter.style.transform = 'scale(1) translateY(0)';
              if (letter.classList.contains('punto')) {
                letter.style.animation = 'float 3s ease-in-out infinite';
              }
            }, 200);
          }, 200);
        }, index * 100);
      });
    });
    
    // Efecto de seguimiento 3D para el título
    document.addEventListener('mousemove', function(e) {
      const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
      const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
      smmContainer.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });
    
    // Inicialización con animación de entrada
    letters.forEach((letter, index) => {
      letter.style.opacity = '0';
      letter.style.transform = 'translateY(50px)';
      
      setTimeout(() => {
        letter.style.transition = 'all 0.5s ease';
        letter.style.opacity = '1';
        letter.style.transform = 'translateY(0)';
      }, 300 + index * 200);
    });
    
    const puntos = document.querySelectorAll('.punto');
    setTimeout(() => {
      puntos.forEach(punto => {
        punto.style.animation = 'float 3s ease-in-out infinite';
      });
    }, 1500);
  });


  document.addEventListener("DOMContentLoaded", function () {
    const btnInicio = document.getElementById("btn-inicio");

    if (btnInicio) {
        btnInicio.addEventListener("click", function (event) {
            event.preventDefault(); // Evita cualquier acción predeterminada
            window.location.href = "/login"; // Redirige a la página de login
        });
    }
});
<<<<<<< HEAD
=======


document.querySelectorAll('.faq-header').forEach(button => {
    button.addEventListener('click', function() {
        const content = this.nextElementSibling;
        content.classList.toggle('active');
        
        // Cambiar el signo +/-
        this.querySelector('.faq-icon').textContent = content.classList.contains('active') ? "−" : "+";
    });
});
>>>>>>> pruebas

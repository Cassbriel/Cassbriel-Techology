document.addEventListener('DOMContentLoaded', async () => {
    // ---------------------------------------------------------
    // 1. SUPABASE INITIALIZATION
    // ---------------------------------------------------------
    const SB_URL = "https://pemcxmrykznozaogsjjj.supabase.co";
    const SB_KEY = "sb_publishable_pI2OLxXdwvLo4fsJRBTBbg_Y1SkeYjr";
    const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

    // ---------------------------------------------------------
    // 2. DATA FETCHING & SYNC
    // ---------------------------------------------------------
    async function syncContent() {
        try {
            // Fetch All Data in Parallel
            const [configRes, servicesRes, projectsRes, testimonialsRes, faqRes] = await Promise.all([
                supabaseClient.from('site_config').select('*'),
                supabaseClient.from('services').select('*').order('order_index'),
                supabaseClient.from('projects').select('*').order('order_index'),
                supabaseClient.from('testimonials').select('*').order('order_index'),
                supabaseClient.from('faq').select('*').order('order_index')
            ]);

            if (configRes.data) {
                const config = {};
                configRes.data.forEach(item => { config[item.key] = item.value; });
                applyGlobalConfig(config);
            }

            if (servicesRes.data) renderServices(servicesRes.data);
            if (projectsRes.data) renderProjects(projectsRes.data);
            if (testimonialsRes.data) renderTestimonials(testimonialsRes.data);
            if (faqRes.data) renderFAQ(faqRes.data);

            // After rendering content, initialize reveal animations
            initReveal();

        } catch (error) {
            console.error("Error fetching content:", error);
        }
    }

    function applyGlobalConfig(db) {
        // Títulos de Portada
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle && db.hero_title) {
            heroTitle.innerHTML = db.hero_title
                .replace('FUTURO', '<span class="gradient-text">FUTURO</span>')
                .replace('PRESENTE', '<span class="outline-text">PRESENTE</span>');
        }

        // Slogan / Descripción
        const heroSlogan = document.querySelector('.hero-content p');
        if (heroSlogan && db.hero_slogan) {
            heroSlogan.textContent = db.hero_slogan;
        }

        // Logo Dinámico
        const logoImg = document.querySelector('.main-logo img');
        if (logoImg && db.logo_url) {
            logoImg.src = db.logo_url;
        }

        // Texto del Logo
        const logoText = document.querySelector('.main-logo .logo-text');
        if (logoText && db.logo_text_main) {
            logoText.innerHTML = `${db.logo_text_main} <span>${db.logo_text_accent || ''}</span>`;
        }

        const footerLogoText = document.querySelector('footer .logo-text');
        if (footerLogoText && db.logo_text_main) {
            footerLogoText.innerHTML = `${db.logo_text_main} <span>${db.logo_text_accent || ''}</span>`;
        }

        // Portada Dinámica
        const heroBg = document.getElementById('hero-dynamic-bg');
        if (heroBg && db.hero_bg_url) {
            heroBg.style.backgroundImage = `url('${db.hero_bg_url}')`;
            heroBg.style.opacity = '0.3';
        }

        // Marcas Aliadas
        const brandsWrapper = document.querySelector('.brands-wrapper');
        if (brandsWrapper && db.brands) {
            const brandList = db.brands.split(',').map(b => b.trim());
            brandsWrapper.innerHTML = brandList.map(b => `<div class="brand-item"><p>${b}</p></div>`).join('');
        }

        // WhatsApp & Email
        const waFloats = document.querySelectorAll('a[href*="wa.me"]');
        const waText = document.querySelector('.contact-methods .method-item:nth-child(1) p');
        if (db.whatsapp) {
            waFloats.forEach(link => link.href = `https://wa.me/${db.whatsapp}`);
            if (waText) waText.textContent = `+${db.whatsapp}`;
        }

        const emailText = document.querySelector('.contact-methods .method-item:nth-child(2) p');
        if (emailText && db.contact_email) {
            emailText.textContent = db.contact_email;
        }
    }

    function renderServices(services) {
        const container = document.querySelector('.services-grid');
        if (!container) return;
        container.innerHTML = services.map(s => `
            <div class="service-card">
                <div class="card-icon"><i class="${s.icon}"></i></div>
                <h3>${s.title}</h3>
                <p>${s.description}</p>
            </div>
        `).join('');
    }

    function renderProjects(projects) {
        const container = document.querySelector('.projects-grid');
        if (!container) return;
        container.innerHTML = projects.map(p => `
            <div class="project-card">
                <img src="${p.image_url}" alt="${p.title}" loading="lazy">
                <div class="project-overlay">
                    <div class="project-info">
                        <span class="project-cat">${p.category}</span>
                        <h3>${p.title}</h3>
                        <p>${p.description}</p>
                        <a href="${p.link || '#'}" class="project-link"><i class="fa-solid fa-arrow-right-long"></i> Ver Detalles</a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderTestimonials(testimonials) {
        const container = document.getElementById('testimonials-container');
        if (!container) return;
        container.innerHTML = testimonials.map(t => `
            <div class="testimonial-card">
                <i class="fa-solid fa-quote-right quote-icon"></i>
                <div class="testimonial-content">
                    "${t.content}"
                </div>
                <div class="testimonial-user">
                    <img src="${t.avatar_url || 'https://ui-avatars.com/api/?name=' + t.name}" alt="${t.name}">
                    <div>
                        <h4>${t.name}</h4>
                        <p>${t.role} ${t.company ? '- ' + t.company : ''}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderFAQ(faq) {
        const container = document.getElementById('faq-container');
        if (!container) return;
        container.innerHTML = faq.map(f => `
            <div class="faq-item">
                <div class="faq-question">
                    ${f.question}
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
                <div class="faq-answer">
                    ${f.answer}
                </div>
            </div>
        `).join('');

        // FAQ Toggle Logic
        document.querySelectorAll('.faq-question').forEach(q => {
            q.addEventListener('click', () => {
                const item = q.parentElement;
                item.classList.toggle('active');
            });
        });
    }

    // ---------------------------------------------------------
    // 3. MOBILE MENU LOGIC
    // ---------------------------------------------------------
    const mobileMenuTrigger = document.getElementById('mobileMenuTrigger');
    const navLinks = document.getElementById('navLinks');

    function toggleMenu() {
        navLinks.classList.toggle('active');
        const icon = mobileMenuTrigger.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-xmark');
        }
    }

    mobileMenuTrigger?.addEventListener('click', toggleMenu);

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) toggleMenu();
        });
    });

    // ---------------------------------------------------------
    // 4. COTIZACIÓN GRATIS MODAL LOGIC
    // ---------------------------------------------------------
    const quoteModal = document.getElementById('quoteModal');
    const openQuoteBtn = document.getElementById('openQuote');
    const closeQuoteBtn = document.getElementById('closeQuoteModal');
    const quoteForm = document.getElementById('quoteForm');

    openQuoteBtn?.addEventListener('click', () => {
        quoteModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeQuoteBtn?.addEventListener('click', () => {
        quoteModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    quoteForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(quoteForm);
        const submitBtn = quoteForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";

        try {
            const response = await fetch(quoteForm.action, {
                method: quoteForm.method,
                body: data,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                alert("¡Solicitud enviada con éxito! Revisa tu correo de confirmación.");
                quoteForm.reset();
                quoteModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            } else {
                alert("Hubo un problema. Por favor intenta de nuevo.");
            }
        } catch (error) {
            alert("Error de conexión. Verifica tu internet e intenta de nuevo.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // ---------------------------------------------------------
    // 5. SCROLL EFFECTS & REVEAL
    // ---------------------------------------------------------
    window.addEventListener('scroll', () => {
        const links = document.querySelectorAll('.nav-links a');
        let current = '';
        document.querySelectorAll('section').forEach(section => {
            if (pageYOffset >= section.offsetTop - 100) current = section.getAttribute('id');
        });
        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) link.classList.add('active');
        });
    });

    function initReveal() {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.service-card, .project-card, .method-item, .contact-glass-form, .testimonial-card, .faq-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease-out';
            revealObserver.observe(el);
        });
    }

    await syncContent();
});

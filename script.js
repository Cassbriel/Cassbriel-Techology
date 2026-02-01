document.addEventListener('DOMContentLoaded', () => {
    // 1. LOGIN & CONTROL MAESTRO LOGIC
    const openAdminBtn = document.getElementById('openAdmin');
    const loginOverlay = document.getElementById('loginOverlay');
    const closeLoginBtn = document.getElementById('closeLogin');
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');
    const loginError = document.getElementById('loginError');

    // Open Login Modal
    if (openAdminBtn) {
        openAdminBtn.addEventListener('click', () => {
            loginOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close Login Modal
    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', () => {
            loginOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
            loginError.style.display = 'none';
            loginForm.reset();
        });
    }

    // Login Validation
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;

            // Credenciales solicitadas
            if (user === 'Hector' && pass === 'Cassiel@123') {
                loginOverlay.classList.remove('active');
                adminPanel.style.display = 'flex';
                setTimeout(() => {
                    adminPanel.classList.add('active');
                }, 10);
            } else {
                loginError.style.display = 'block';
                // Shake effect
                const card = document.querySelector('.login-card');
                card.style.animation = 'none';
                void card.offsetWidth;
                card.style.animation = 'shake 0.4s ease';
            }
        });
    }

    const closeAdminBtn = document.getElementById('closeAdmin');

    if (closeAdminBtn && adminPanel) {
        closeAdminBtn.addEventListener('click', () => {
            adminPanel.classList.remove('active');
            setTimeout(() => {
                adminPanel.style.display = 'none';
                document.body.style.overflow = 'auto'; // Unlock scroll
            }, 500);
        });
    }

    // 2. ADMIN TABS LOGIC
    const sidebarItems = document.querySelectorAll('.sidebar-menu li');
    const adminTabs = document.querySelectorAll('.admin-tab');

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-tab');

            // Update sidebar UI
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update Tabs content
            // Note: In a real app, we'd inject content here.
            // For now, we simulate switching.
            console.log(`Cambiando a pestaña: ${targetId}`);

            // This is a simple visual feedback for demo
            document.querySelectorAll('.admin-tab').forEach(tab => {
                tab.style.display = 'none';
            });
            const activeTab = document.getElementById(`tab-${targetId}`);
            if (activeTab) {
                activeTab.style.display = 'block';
            } else {
                // Temporary mock for tabs not yet in HTML
                const content = document.querySelector('.panel-content');
                // Remove previous mock if exists
                const oldMock = document.getElementById('mock-tab');
                if (oldMock) oldMock.remove();

                const mock = document.createElement('div');
                mock.id = 'mock-tab';
                mock.className = 'admin-tab';
                mock.innerHTML = `
                    <h2 style="margin-bottom: 2rem;">Módulo: ${targetId.toUpperCase()}</h2>
                    <div class="stat-box" style="margin-top: 2rem; border-style: dashed; opacity: 0.6;">
                        <p><i class="fa-solid fa-screwdriver-wrench"></i> Centro de Control de ${targetId}</p>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 1rem;">
                            Aquí puedes gestionar los datos de ${targetId} en tiempo real.
                        </p>
                    </div>
                `;
                content.appendChild(mock);
            }
        });
    });

    // 3. SMOOTH SCROLL & ACTIVE LINKS
    const navLinks = document.querySelectorAll('.nav-links a');
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // 4. ANIMATION ON SCROLL
    const observerOptions = {
        threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.service-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        revealObserver.observe(card);
    });
});

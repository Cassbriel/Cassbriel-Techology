document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. DATABASE SYSTEM (LOCALSTORAGE MOCK)
    // ---------------------------------------------------------
    const DB_KEY = 'cassbriel_master_data';
    let db = JSON.parse(localStorage.getItem(DB_KEY)) || {
        users: [
            { id: 1, user: 'Hector', pass: 'Cassiel@123', role: 'admin', perms: ['edit_web', 'view_money', 'manage_users'] }
        ],
        content: {
            heroTitle: 'Protegiendo el <span class="gradient-text">Futuro</span>, Optimizando el Presente.',
            heroDesc: 'Especialistas en seguridad electrónica, infraestructura de red y soluciones de hardware a medida. Innovamos para que tu tranquilidad no tenga límites.',
            whatsapp: '51900000000'
        },
        stats: {
            ingresos: 12450.00
        }
    };

    function saveDB() {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
        updateFrontend();
    }

    function updateFrontend() {
        // Update Actual Website
        const heroH1 = document.querySelector('.hero h1');
        const heroP = document.querySelector('.hero p');
        const waLink = document.querySelector('.whatsapp-float');

        if (heroH1) heroH1.innerHTML = db.content.heroTitle;
        if (heroP) heroP.textContent = db.content.heroDesc;
        if (waLink) waLink.href = `https://wa.me/${db.content.whatsapp}`;

        // Sync Admin Inputs if open
        const editTitle = document.getElementById('edit-hero-title');
        const editDesc = document.getElementById('edit-hero-desc');
        const editWa = document.getElementById('edit-whatsapp');

        if (editTitle) editTitle.value = db.content.heroTitle;
        if (editDesc) editDesc.value = db.content.heroDesc;
        if (editWa) editWa.value = db.content.whatsapp;

        // Render User List
        renderUsers();
    }

    // ---------------------------------------------------------
    // 2. LOGIN & PERMISSIONS
    // ---------------------------------------------------------
    let currentUser = null;

    const loginForm = document.getElementById('loginForm');
    const loginOverlay = document.getElementById('loginOverlay');
    const adminPanel = document.getElementById('adminPanel');
    const loginError = document.getElementById('loginError');

    document.getElementById('openAdmin').addEventListener('click', () => {
        loginOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    document.getElementById('closeLogin').addEventListener('click', () => {
        loginOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;

        const found = db.users.find(user => user.user === u && user.pass === p);

        if (found) {
            currentUser = found;
            loginOverlay.classList.remove('active');
            applyPermissions();
            adminPanel.style.display = 'flex';
            setTimeout(() => adminPanel.classList.add('active'), 10);
            loginForm.reset();
        } else {
            loginError.style.display = 'block';
            document.querySelector('.login-card').style.animation = 'shake 0.4s ease';
        }
    });

    function applyPermissions() {
        // Hide/Show tabs based on currentUser perms
        const tabs = document.querySelectorAll('.sidebar-menu li');
        tabs.forEach(tab => {
            const permissionNeeded = {
                'resumen': null,
                'diseno': 'edit_web',
                'productos': null,
                'usuarios': 'manage_users',
                'contabilidad': 'view_money',
                'config': null
            }[tab.getAttribute('data-tab')];

            if (permissionNeeded && !currentUser.perms.includes(permissionNeeded)) {
                tab.style.display = 'none';
            } else {
                tab.style.display = 'flex';
            }
        });

        // Hide special buttons in tabs
        const btnAddUser = document.getElementById('btn-add-user');
        if (btnAddUser) btnAddUser.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    }

    // ---------------------------------------------------------
    // 3. EDIT CONTENT LOGIC
    // ---------------------------------------------------------
    document.getElementById('save-web-content')?.addEventListener('click', () => {
        if (!currentUser.perms.includes('edit_web')) return alert('No tienes permisos.');

        db.content.heroTitle = document.getElementById('edit-hero-title').value;
        db.content.heroDesc = document.getElementById('edit-hero-desc').value;
        db.content.whatsapp = document.getElementById('edit-whatsapp').value;

        saveDB();
        alert('Web actualizada correctamente.');
    });

    // ---------------------------------------------------------
    // 4. USER MANAGEMENT
    // ---------------------------------------------------------
    function renderUsers() {
        const list = document.getElementById('users-list');
        if (!list) return;
        list.innerHTML = db.users.map(u => `
            <tr>
                <td><strong>${u.user}</strong></td>
                <td><span class="badge-role ${u.role}">${u.role}</span></td>
                <td><small>${u.perms.join(', ')}</small></td>
                <td>
                    ${u.user !== 'Hector' ? `<button class="btn-delete" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>` : 'System'}
                </td>
            </tr>
        `).join('');
    }

    window.deleteUser = function (id) {
        if (currentUser.role !== 'admin') return alert('Solo el Administrador puede borrar usuarios.');
        db.users = db.users.filter(u => u.id !== id);
        saveDB();
    };

    const userModal = document.getElementById('userModal');
    document.getElementById('btn-add-user')?.addEventListener('click', () => {
        userModal.classList.add('active');
    });

    document.getElementById('closeUserModal')?.addEventListener('click', () => {
        userModal.classList.remove('active');
    });

    document.getElementById('newUserForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedPerms = Array.from(document.querySelectorAll('input[name="perm"]:checked')).map(cb => cb.value);

        const newUser = {
            id: Date.now(),
            user: document.getElementById('new-username').value,
            pass: document.getElementById('new-password').value,
            role: document.getElementById('new-role').value,
            perms: selectedPerms
        };

        db.users.push(newUser);
        saveDB();
        userModal.classList.remove('active');
        e.target.reset();
    });

    // Logout
    document.getElementById('closeAdmin').addEventListener('click', () => {
        adminPanel.classList.remove('active');
        setTimeout(() => adminPanel.style.display = 'none', 500);
        document.body.style.overflow = 'auto';
        currentUser = null;
    });

    // Sidebar Navigation
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));

            item.classList.add('active');
            const target = document.getElementById(`tab-${item.getAttribute('data-tab')}`);
            if (target) target.classList.add('active');
        });
    });

    // Initial Load
    updateFrontend();
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

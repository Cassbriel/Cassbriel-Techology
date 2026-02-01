document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. DATABASE SYSTEM (LOCALSTORAGE)
    // ---------------------------------------------------------
    const DB_KEY = 'cassbriel_master_db_v3';
    let db = JSON.parse(localStorage.getItem(DB_KEY)) || {
        users: [
            { id: 1, user: 'Hector', pass: 'Cassiel@123', role: 'admin', perms: ['edit_web', 'view_money', 'manage_users'] }
        ],
        content: {
            heroTitle: 'Protegiendo el <span class="gradient-text">Futuro</span>, Optimizando el Presente.',
            heroDesc: 'Especialistas en seguridad electrónica, infraestructura de red y soluciones de hardware a medida. Innovamos para que tu tranquilidad no tenga límites.',
            whatsapp: '51900000000'
        },
        products: [
            { id: 1, name: 'Cámara IP Hikvision 4MP', price: 250, stock: 15 },
            { id: 2, name: 'Repetidor WiFi TP-Link', price: 85, stock: 24 }
        ],
        movements: [
            { id: 1, concept: 'Saldo Inicial', amount: 12450.00, type: 'ingreso', date: '01/02/2026' }
        ]
    };

    function saveDB() {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
        updateFrontend();
    }

    function updateFrontend() {
        // Website Sync
        const heroH1 = document.querySelector('.hero h1');
        const heroP = document.querySelector('.hero p');
        const waLink = document.querySelector('.whatsapp-float');

        if (heroH1) heroH1.innerHTML = db.content.heroTitle;
        if (heroP) heroP.textContent = db.content.heroDesc;
        if (waLink) waLink.href = `https://wa.me/${db.content.whatsapp}`;

        // Admin Fields Sync
        const editTitle = document.getElementById('edit-hero-title');
        const editDesc = document.getElementById('edit-hero-desc');
        const editWa = document.getElementById('edit-whatsapp');

        if (editTitle) editTitle.value = db.content.heroTitle.replace(/<[^>]*>?/gm, ''); // Clean HTML for input
        if (editDesc) editDesc.value = db.content.heroDesc;
        if (editWa) editWa.value = db.content.whatsapp;

        // Render Admin Sections
        renderUsers();
        renderProducts();
        updateStats();
    }

    function updateStats() {
        const income = db.movements.filter(m => m.type === 'ingreso').reduce((sum, m) => sum + m.amount, 0);
        const expense = db.movements.filter(m => m.type === 'salida').reduce((sum, m) => sum + m.amount, 0);
        const total = income - expense;

        const statIngresos = document.getElementById('stat-ingresos');
        if (statIngresos) statIngresos.textContent = `S/ ${total.toFixed(2)}`;

        const statUsuarios = document.getElementById('stat-usuarios');
        if (statUsuarios) statUsuarios.textContent = db.users.length;

        const contIncome = document.getElementById('total-income');
        const contExpense = document.getElementById('total-expense');
        if (contIncome) contIncome.textContent = `S/ ${income.toFixed(2)}`;
        if (contExpense) contExpense.textContent = `S/ ${expense.toFixed(2)}`;
    }

    // ---------------------------------------------------------
    // 2. AUTH & PERMISSIONS
    // ---------------------------------------------------------
    let currentUser = null;

    const loginForm = document.getElementById('loginForm');
    const loginOverlay = document.getElementById('loginOverlay');
    const adminPanel = document.getElementById('adminPanel');
    const loginError = document.getElementById('loginError');

    // Open Login
    document.getElementById('openAdmin')?.addEventListener('click', () => {
        loginOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close Login
    document.getElementById('closeLogin')?.addEventListener('click', () => {
        loginOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        loginError.style.display = 'none';
        loginForm.reset();
    });

    // Login Action
    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;

        const found = db.users.find(user => user.user === u && user.pass === p);

        if (found) {
            currentUser = found;
            loginOverlay.classList.remove('active');
            applyPermissions();
            adminPanel.style.display = 'flex';
            setTimeout(() => {
                adminPanel.classList.add('active');
                updateFrontend();
            }, 10);
            loginForm.reset();
        } else {
            loginError.style.display = 'block';
            const card = document.querySelector('.login-card');
            card.style.animation = 'shake 0.4s ease';
            setTimeout(() => card.style.animation = '', 400);
        }
    });

    function applyPermissions() {
        const tabs = document.querySelectorAll('.sidebar-menu li');
        tabs.forEach(tab => {
            const key = tab.getAttribute('data-tab');
            const perms = {
                'diseno': 'edit_web',
                'usuarios': 'manage_users',
                'contabilidad': 'view_money'
            };
            const needed = perms[key];
            if (needed && !currentUser.perms.includes(needed)) {
                tab.style.display = 'none';
            } else {
                tab.style.display = 'flex';
            }
        });

        const btnAddUser = document.getElementById('btn-add-user');
        if (btnAddUser) btnAddUser.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    }

    // ---------------------------------------------------------
    // 3. ADMIN ACTIONS
    // ---------------------------------------------------------

    // Web Content Save
    document.getElementById('save-web-content')?.addEventListener('click', () => {
        if (!currentUser.perms.includes('edit_web')) return alert('No tienes permisos.');

        let title = document.getElementById('edit-hero-title').value;
        // Re-inject gradient span if it looks like it was removed
        if (!title.includes('<span')) {
            title = title.replace('Futuro', '<span class="gradient-text">Futuro</span>');
        }

        db.content.heroTitle = title;
        db.content.heroDesc = document.getElementById('edit-hero-desc').value;
        db.content.whatsapp = document.getElementById('edit-whatsapp').value;

        saveDB();
        alert('Cambios guardados con éxito.');
    });

    // Products Management
    function renderProducts() {
        const list = document.getElementById('product-list-admin');
        if (!list) return;
        list.innerHTML = db.products.map(p => `
            <tr>
                <td><i class="fa-solid fa-box-open" style="color: var(--primary-blue)"></i></td>
                <td><strong>${p.name}</strong></td>
                <td>S/ ${p.price.toFixed(2)}</td>
                <td><span class="badge-role admin">${p.stock}</span></td>
                <td><button class="btn-delete" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `).join('');
    }

    window.deleteProduct = (id) => {
        db.products = db.products.filter(p => p.id !== id);
        saveDB();
    };

    const pModal = document.getElementById('productModal');
    document.getElementById('btn-add-product')?.addEventListener('click', () => pModal.classList.add('active'));
    document.getElementById('closeProductModal')?.addEventListener('click', () => pModal.classList.remove('active'));

    document.getElementById('newProductForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        db.products.push({
            id: Date.now(),
            name: document.getElementById('p-name').value,
            price: parseFloat(document.getElementById('p-price').value),
            stock: parseInt(document.getElementById('p-stock').value)
        });
        saveDB();
        pModal.classList.remove('active');
        e.target.reset();
    });

    // Accounting Management
    document.getElementById('accounting-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentUser.perms.includes('view_money')) return alert('No tienes permisos.');

        db.movements.push({
            id: Date.now(),
            concept: document.getElementById('acc-concept').value,
            amount: parseFloat(document.getElementById('acc-amount').value),
            type: document.getElementById('acc-type').value,
            date: new Date().toLocaleDateString()
        });
        saveDB();
        e.target.reset();
        alert('Movimiento de caja registrado.');
    });

    // User Management
    function renderUsers() {
        const list = document.getElementById('users-list');
        if (!list) return;
        list.innerHTML = db.users.map(u => `
            <tr>
                <td><strong>${u.user}</strong></td>
                <td><span class="badge-role ${u.role}">${u.role}</span></td>
                <td><small>${u.perms.join(', ')}</small></td>
                <td>${u.user !== 'Hector' ? `<button class="btn-delete" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>` : '<i class="fa-solid fa-lock" title="Sistema"></i>'}</td>
            </tr>
        `).join('');
    }

    window.deleteUser = (id) => {
        if (currentUser.role !== 'admin') return alert('Solo el Admin principal puede eliminar personal.');
        db.users = db.users.filter(u => u.id !== id);
        saveDB();
    };

    const uModal = document.getElementById('userModal');
    document.getElementById('btn-add-user')?.addEventListener('click', () => uModal.classList.add('active'));
    document.getElementById('closeUserModal')?.addEventListener('click', () => uModal.classList.remove('active'));

    document.getElementById('newUserForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const perms = Array.from(document.querySelectorAll('input[name="perm"]:checked')).map(cb => cb.value);
        db.users.push({
            id: Date.now(),
            user: document.getElementById('new-username').value,
            pass: document.getElementById('new-password').value,
            role: document.getElementById('new-role').value,
            perms: perms
        });
        saveDB();
        uModal.classList.remove('active');
        e.target.reset();
    });

    // Navigation Logic
    document.getElementById('closeAdmin')?.addEventListener('click', () => {
        adminPanel.classList.remove('active');
        setTimeout(() => adminPanel.style.display = 'none', 500);
        document.body.style.overflow = 'auto';
        currentUser = null;
    });

    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));

            item.classList.add('active');
            const target = document.getElementById(`tab-${tabId}`);
            if (target) target.classList.add('active');
        });
    });

    // Initial Load
    updateFrontend();
});

// ---------------------------------------------------------
// 4. FRONTEND INTERACTIVITY (SCROLL & ANIM)
// ---------------------------------------------------------
window.addEventListener('scroll', () => {
    const navLinks = document.querySelectorAll('.nav-links a');
    let current = '';
    document.querySelectorAll('section').forEach(section => {
        if (pageYOffset >= section.offsetTop - 100) {
            current = section.getAttribute('id');
        }
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) link.classList.add('active');
    });
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease-out';
    revealObserver.observe(card);
});

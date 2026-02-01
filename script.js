document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. SISTEMA DE BASE DE DATOS (LIVING DB)
    // ---------------------------------------------------------
    const DB_KEY = 'cassbriel_master_ultra_v6';
    let db = JSON.parse(localStorage.getItem(DB_KEY)) || {
        users: [
            { id: 1, user: 'Hector', pass: 'Cassiel@123', role: 'admin', perms: ['edit_web', 'view_money', 'manage_users'] }
        ],
        content: {
            heroTitle: 'Protegiendo el <span class="gradient-text">Futuro</span>, Optimizando el Presente.',
            heroDesc: 'Especialistas en seguridad electrónica, infraestructura de red y soluciones de hardware a medida. Innovamos para que tu tranquilidad no tenga límites.',
            whatsapp: '51900000000'
        },
        categories: ['Seguridad', 'Cómputo', 'Redes', 'Impresoras', 'Otros'],
        products: [
            { id: 1, name: 'Cámara IP Hikvision 4MP', category: 'Seguridad', price: 250, stock: 15 },
            { id: 2, name: 'Repetidor WiFi TP-Link', category: 'Redes', price: 85, stock: 24 }
        ],
        movements: []
    };

    function saveDB() {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
        updateFrontend();
    }

    function updateFrontend() {
        // Sincronización con la Web Pública
        const heroH1 = document.querySelector('.hero h1');
        const heroP = document.querySelector('.hero p');
        const waLink = document.querySelector('.whatsapp-float');

        if (heroH1) heroH1.innerHTML = db.content.heroTitle;
        if (heroP) heroP.textContent = db.content.heroDesc;
        if (waLink) waLink.href = `https://wa.me/${db.content.whatsapp}`;

        // Sincronización con los inputs del Panel
        const editTitle = document.getElementById('edit-hero-title');
        const editDesc = document.getElementById('edit-hero-desc');
        const editWa = document.getElementById('edit-whatsapp');

        if (editTitle) editTitle.value = db.content.heroTitle.replace(/<[^>]*>?/gm, '');
        if (editDesc) editDesc.value = db.content.heroDesc;
        if (editWa) editWa.value = db.content.whatsapp;

        // Renderizar Todo
        renderUsers();
        renderProducts();
        renderCategories();
        syncCategorySelects();
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
    // 2. AUTENTICACIÓN Y ACCESO
    // ---------------------------------------------------------
    let currentUser = null;

    const loginForm = document.getElementById('loginForm');
    const loginOverlay = document.getElementById('loginOverlay');
    const adminPanel = document.getElementById('adminPanel');
    const loginError = document.getElementById('loginError');

    document.getElementById('openAdmin')?.addEventListener('click', () => {
        loginOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    document.getElementById('closeLogin')?.addEventListener('click', () => {
        loginOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        loginError.style.display = 'none';
        loginForm.reset();
    });

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
                document.querySelector('[data-tab="resumen"]').click();
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
    // 3. CAPACIDAD DE ADMINISTRACIÓN (TABS)
    // ---------------------------------------------------------

    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');
            document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.admin-tab').forEach(t => {
                t.classList.remove('active');
                t.style.display = 'none';
            });
            const target = document.getElementById(`tab-${tabId}`);
            if (target) {
                target.style.display = 'block';
                setTimeout(() => target.classList.add('active'), 10);
            }
        });
    });

    // Guardar Diseño Web
    document.getElementById('save-web-content')?.addEventListener('click', () => {
        if (!currentUser.perms.includes('edit_web')) return alert('No tienes permisos.');
        let title = document.getElementById('edit-hero-title').value;
        if (!title.includes('<span')) title = title.replace('Futuro', '<span class=\"gradient-text\">Futuro</span>');
        db.content.heroTitle = title;
        db.content.heroDesc = document.getElementById('edit-hero-desc').value;
        db.content.whatsapp = document.getElementById('edit-whatsapp').value;
        saveDB();
        alert('Contenido actualizado correctamente.');
    });

    // ---------------------------------------------------------
    // 4. CATEGORÍAS MANAGEMENT
    // ---------------------------------------------------------
    function renderCategories() {
        const list = document.getElementById('category-list-admin');
        if (!list) return;
        list.innerHTML = db.categories.map((cat, index) => {
            const productCount = db.products.filter(p => p.category === cat).length;
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${cat}</strong></td>
                    <td><span class="badge-role admin">${productCount} Artículos</span></td>
                    <td>
                        <button class="btn-delete" onclick="window.deleteCategory('${cat}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function syncCategorySelects() {
        const select = document.getElementById('p-category');
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = db.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        if (db.categories.includes(currentVal)) select.value = currentVal;
    }

    document.getElementById('btn-add-category')?.addEventListener('click', () => {
        const input = document.getElementById('new-cat-name');
        const name = input.value.trim();
        if (!name) return;
        if (db.categories.includes(name)) return alert('La categoría ya existe.');
        db.categories.push(name);
        input.value = '';
        saveDB();
    });

    window.deleteCategory = (name) => {
        if (!confirm(`¿Seguro que deseas eliminar la categoría "${name}"? Los productos vinculados quedarán sin categoría.`)) return;
        db.categories = db.categories.filter(c => c !== name);
        saveDB();
    };

    // ---------------------------------------------------------
    // 5. PRODUCTOS MANAGEMENT
    // ---------------------------------------------------------
    function renderProducts() {
        const list = document.getElementById('product-list-admin');
        if (!list) return;
        list.innerHTML = db.products.map(p => `
            <tr>
                <td><i class="fa-solid fa-box-open" style="color: #00a8ff"></i></td>
                <td><strong>${p.name}</strong></td>
                <td><span class="badge-role staff" style="font-size: 0.7rem;">${p.category || 'Sin Cat.'}</span></td>
                <td>S/ ${parseFloat(p.price).toFixed(2)}</td>
                <td><span class="badge-role admin">${p.stock}</span></td>
                <td><button class="btn-delete" onclick="window.deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button></td>
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
            category: document.getElementById('p-category').value,
            price: parseFloat(document.getElementById('p-price').value),
            stock: parseInt(document.getElementById('p-stock').value)
        });
        saveDB();
        pModal.classList.remove('active');
        e.target.reset();
    });

    // ---------------------------------------------------------
    // 6. CONTABILIDAD & USUARIOS
    // ---------------------------------------------------------
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
        alert('Movimiento registrado.');
    });

    function renderUsers() {
        const list = document.getElementById('users-list');
        if (!list) return;
        list.innerHTML = db.users.map(u => `
            <tr>
                <td><strong>${u.user}</strong></td>
                <td><span class="badge-role ${u.role}">${u.role}</span></td>
                <td><small>${u.perms.join(', ')}</small></td>
                <td>${u.user !== 'Hector' ? `<button class="btn-delete" onclick="window.deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>` : '<i class="fa-solid fa-lock"></i>'}</td>
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
        db.users.push({ id: Date.now(), user: document.getElementById('new-username').value, pass: document.getElementById('new-password').value, role: document.getElementById('new-role').value, perms: perms });
        saveDB();
        uModal.classList.remove('active');
        e.target.reset();
    });

    document.getElementById('closeAdmin')?.addEventListener('click', () => {
        adminPanel.classList.remove('active');
        setTimeout(() => adminPanel.style.display = 'none', 500);
        document.body.style.overflow = 'auto';
        currentUser = null;
    });

    // Otros UX
    window.addEventListener('scroll', () => {
        const navLinks = document.querySelectorAll('.nav-links a');
        let current = '';
        document.querySelectorAll('section').forEach(section => { if (pageYOffset >= section.offsetTop - 100) current = section.getAttribute('id'); });
        navLinks.forEach(link => { link.classList.remove('active'); if (link.getAttribute('href').includes(current)) link.classList.add('active'); });
    });

    const revealObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; } }); }, { threshold: 0.1 });
    document.querySelectorAll('.service-card').forEach(card => { card.style.opacity = '0'; card.style.transform = 'translateY(30px)'; card.style.transition = 'all 0.6s ease-out'; revealObserver.observe(card); });

    // ---------------------------------------------------------
    // 7. COTIZACIÓN GRATIS MODAL LOGIC
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
    // 8. MOBILE MENU LOGIC
    // ---------------------------------------------------------
    const mobileMenuTrigger = document.getElementById('mobileMenuTrigger');
    const navLinks = document.getElementById('navLinks');
    const mobileAdminTrigger = document.getElementById('mobileAdminTrigger');

    function toggleMenu() {
        navLinks.classList.toggle('active');
        const icon = mobileMenuTrigger.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-xmark');
        }
    }

    mobileMenuTrigger?.addEventListener('click', toggleMenu);

    mobileAdminTrigger?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu();
        document.getElementById('loginOverlay').classList.add('active');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a:not(#mobileAdminTrigger)').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    updateFrontend();
});

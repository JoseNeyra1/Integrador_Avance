document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONEXIÓN AL BACKEND DE SPRING BOOT ---
    const API_URL = 'http://localhost:8080/api';

    // Variables globales
    let products = [];
    let cart = JSON.parse(localStorage.getItem('flics_cart')) || []; 
    
    let instanceChartProductos = null;
    let instanceChartDinero = null;
    let instanceChartUsuarios = null;

    function saveCart() { localStorage.setItem('flics_cart', JSON.stringify(cart)); }

    // 1. CARGAR PRODUCTOS DESDE MYSQL (Reemplaza el defaultProducts y LocalStorage)
    async function cargarProductosDesdeBackend() {
        try {
            const respuesta = await fetch(`${API_URL}/productos`);
            if (respuesta.ok) {
                const dataJava = await respuesta.json();
                
                // Mapeamos los datos de Java al formato que usa tu hermoso diseño
                products = dataJava.map(p => ({
                    id: p.idProducto,
                    name: p.nombre,
                    category: p.categoria ? p.categoria.nombre : "General",
                    price: p.precioVenta,
                    // Como tu backend aún no tiene campo de imagen, ponemos un placeholder elegante
                    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600", 
                    badge: p.stock <= p.stockMinimo ? "¡Poco Stock!" : "",
                    stockReal: p.stock
                }));

                renderPublicProducts();
                if (document.getElementById('admin-dashboard-modal').classList.contains('show')) {
                    renderAdminProducts(); // Si el admin está abierto, lo actualiza también
                }
            }
        } catch (error) {
            console.error("Error conectando con Spring Boot:", error);
            showToast("Error de conexión. Verifica que el servidor Java esté encendido.");
        }
    }

    // --- CATÁLOGO PÚBLICO ---
    const productsContainer = document.getElementById('products-container');

    function renderPublicProducts() {
        if (!productsContainer) return;
        productsContainer.innerHTML = '';

        if (products.length === 0) {
            productsContainer.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 40px;">No hay productos en la base de datos.</p>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            card.innerHTML = `
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                <div class="product-img-container">
                    <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                </div>
                <div class="product-info">
                    <span class="product-cat">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-meta">
                        <span class="product-price">S/ ${Number(product.price).toFixed(2)}</span>
                        <button class="btn-add-cart" data-id="${product.id}" ${product.stockReal <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-${product.stockReal <= 0 ? 'times' : 'plus'}"></i>
                        </button>
                    </div>
                </div>
            `;
            productsContainer.appendChild(card);
        });

        // Eventos de botones (Recreados para evitar duplicados)
        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.parentNode.replaceChild(btn.cloneNode(true), btn);
        });
        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            if(!btn.disabled) {
                btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.id)));
            }
        });
    }

    // --- LÓGICA DEL CARRITO ---
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartIcon = document.getElementById('cart-icon');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalPriceEl = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (cartIcon) cartIcon.addEventListener('click', (e) => { e.preventDefault(); toggleCart(true); });
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
    if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));

    function toggleCart(open) {
        if (open) { cartSidebar.classList.add('show'); cartOverlay.classList.add('show'); }
        else { cartSidebar.classList.remove('show'); cartOverlay.classList.remove('show'); }
    }

    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) { 
            // Validar que no pida más del stock disponible en MySQL
            if (cartItem.quantity < product.stockReal) {
                cartItem.quantity += 1; 
            } else {
                showToast("No hay más stock disponible de este producto.");
                return;
            }
        } 
        else { cart.push({ ...product, quantity: 1 }); }

        saveCart();
        updateCartUi();
        showToast(`"${product.name}" añadido al carrito.`);
    }

    function updateCartUi() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let count = 0;

        cart.forEach(item => {
            total += item.price * item.quantity;
            count += item.quantity;

            const div = document.createElement('div');
            div.classList.add('cart-item');
            div.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${item.quantity} x S/ ${Number(item.price).toFixed(2)}</div>
                </div>
                <button class="btn-remove" style="background:none; border:none; color:var(--accent-color); cursor:pointer;" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            `;
            cartItemsContainer.appendChild(div);
        });

        if (cartCountEl) cartCountEl.textContent = count;
        if (cartTotalPriceEl) cartTotalPriceEl.textContent = `S/ ${total.toFixed(2)}`;

        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                cart = cart.filter(item => item.id !== id);
                saveCart();
                updateCartUi();
            });
        });
    }

    // --- CHECKOUT CON ENVÍO AL BACKEND ---
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) { alert('Su carrito se encuentra vacío.'); return; }
            toggleCart(false);
            document.getElementById('payment-modal').classList.add('show');
        });
    }

    document.getElementById('close-payment')?.addEventListener('click', () => document.getElementById('payment-modal').classList.remove('show'));
    document.getElementById('close-yape')?.addEventListener('click', () => document.getElementById('yape-modal').classList.remove('show'));

    document.getElementById('pay-cash')?.addEventListener('click', () => finalizarPedido('Efectivo'));
    document.getElementById('pay-yape')?.addEventListener('click', () => {
        document.getElementById('payment-modal').classList.remove('show');
        document.getElementById('yape-modal').classList.add('show');
    });
    document.getElementById('confirm-yape')?.addEventListener('click', () => {
        document.getElementById('yape-modal').classList.remove('show');
        finalizarPedido('Yape');
    });

    async function finalizarPedido(metodo) {
        // Armamos el JSON exactamente como lo espera PedidoRequest en Java
        const total = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
        const pedidoData = {
            pedido: { 
                estado: "Pendiente",
                total: total
                // Aquí podrías agregar comprobanteYape si el método es Yape
            },
            detalles: cart.map(item => ({
                producto: { idProducto: item.id },
                cantidad: item.quantity,
                precioCompra: item.price
            }))
        };

        try {
            const respuesta = await fetch(`${API_URL}/pedidos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedidoData)
            });

            if (respuesta.ok) {
                const pedidoConfirmado = await respuesta.json();
                alert(`¡Pedido procesado con éxito en Base de Datos!\nCódigo de Orden: FL-${pedidoConfirmado.idPedido}\nPago: ${metodo}`);
                
                cart = [];
                saveCart();
                updateCartUi();
                cargarProductosDesdeBackend(); // Recarga los productos para actualizar el stock real visualmente
                
                // Opcional: Cerrar el modal de pago si sigue abierto
                document.getElementById('payment-modal').classList.remove('show');
            } else {
                throw new Error("El servidor rechazó el pedido. Verifica el stock.");
            }
        } catch (error) {
            console.error("Error al registrar venta:", error);
            alert("Hubo un problema procesando tu pedido. Revisa que haya stock suficiente.");
        }
    }

    // --- LOGIN DE ADMINISTRADOR HACIA SPRING BOOT ---
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const navLoginBtn = document.getElementById('nav-login-btn');
    const adminLoginModal = document.getElementById('admin-login-modal');
    const closeLoginBtn = document.getElementById('close-login');
    const loginSubmitBtn = document.getElementById('login-submit');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');

    const adminDashboardModal = document.getElementById('admin-dashboard-modal');
    const closeDashboardBtn = document.getElementById('close-dashboard');

    if (adminLoginBtn) adminLoginBtn.addEventListener('click', (e) => { e.preventDefault(); openLogin(); });
    if (navLoginBtn) navLoginBtn.addEventListener('click', (e) => { e.preventDefault(); openLogin(); });
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', () => adminLoginModal.classList.remove('show'));
    if (closeDashboardBtn) closeDashboardBtn.addEventListener('click', () => adminDashboardModal.classList.remove('show'));

    function openLogin() {
        if (loginError) loginError.textContent = '';
        if (loginEmail) loginEmail.value = '';
        if (loginPassword) loginPassword.value = '';
        adminLoginModal.classList.add('show');
    }

    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', async () => {
            try {
                // Hacemos POST a tu AuthController
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        idUsuario: loginEmail.value.trim(),
                        password: loginPassword.value
                    })
                });

                if (res.ok) {
                    const usuarioData = await res.json();
                    adminLoginModal.classList.remove('show');
                    adminDashboardModal.classList.add('show');
                    showToast(`Bienvenido(a), ${usuarioData.rol}`);
                    initAdminDashboard();
                } else {
                    loginError.textContent = 'Credenciales incorrectas o usuario inactivo en BD';
                }
            } catch (error) {
                loginError.textContent = 'Error de conexión con el servidor de seguridad';
            }
        });
    }

    // --- PANEL ADMIN (Solo renderizado básico con datos de BD) ---
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const currentTabId = btn.dataset.tab;
            document.getElementById(currentTabId)?.classList.add('active');
            
            if (currentTabId === 'tab-pedidos') cargarPedidosAdmin();
        });
    });

    function initAdminDashboard() {
        renderAdminProducts();
    }

    function renderAdminProducts() {
        const container = document.getElementById('admin-products-container');
        if (!container) return;
        container.innerHTML = '';

        products.forEach(product => {
            const itemHtml = `
                <div class="admin-item" data-id="${product.id}">
                    <div class="admin-item-info">
                        <div class="admin-item-title">${product.name}</div>
                        <div class="admin-item-cat">Stock en BD: ${product.stockReal}</div>
                    </div>
                    <div class="admin-item-price-edit">
                        S/ ${Number(product.price).toFixed(2)}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', itemHtml);
        });
    }

    // Cargar los pedidos reales desde MySQL para el dashboard
    async function cargarPedidosAdmin() {
        const container = document.getElementById('admin-orders-container');
        if (!container) return;
        
        try {
            const res = await fetch(`${API_URL}/pedidos`);
            if (res.ok) {
                const pedidosBd = await res.json();
                container.innerHTML = pedidosBd.map(order => `
                    <div class="admin-item" style="flex-direction: column; align-items: flex-start; gap: 5px;">
                        <div style="display: flex; justify-content: space-between; width: 100%; font-weight: bold;">
                            <span>Pedido #${order.idPedido}</span>
                            <span style="color: var(--primary-color);">${order.estado}</span>
                        </div>
                        <div style="font-weight: 700;">Total: S/ ${Number(order.total).toFixed(2)}</div>
                    </div>
                `).join('') || '<p class="text-muted">No se registran pedidos en MySQL.</p>';
            }
        } catch (error) {
            container.innerHTML = '<p class="text-muted">Error cargando pedidos desde Java.</p>';
        }
    }

    // --- SISTEMA TOASTS ---
    function showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.classList.add('toast');
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // 🚀 INICIO DEL SISTEMA
    updateCartUi();
    cargarProductosDesdeBackend(); // Dispara la carga inicial desde MySQL
});
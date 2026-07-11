document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONEXIÓN AL BACKEND DE SPRING BOOT ---
    const API_URL = window.BACKEND_API_URL || 'http://localhost:8080/api';

    // Variables globales
    let products = [];
    let cart = JSON.parse(localStorage.getItem('flics_cart')) || []; 

    function saveCart() { localStorage.setItem('flics_cart', JSON.stringify(cart)); }

    // --- CONFIGURACIÓN DE NOTIFICACIONES (SweetAlert2) ---
    const Toast = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    // --- VERIFICAR SESIÓN DEL CLIENTE EN LA INTERFAZ ---
    const btnNavLogin = document.getElementById('btn-nav-login');
    const clienteLogueado = localStorage.getItem('flics_cliente_web');

    if (clienteLogueado && btnNavLogin) {
        const cliente = JSON.parse(clienteLogueado);
        
        // Cambiamos el texto del botón al nombre del cliente
        btnNavLogin.innerHTML = `<i class="fas fa-user-check"></i> Hola, ${cliente.nombre.split(' ')[0]}`;
        btnNavLogin.href = "#"; 
        btnNavLogin.classList.remove('btn-primary-outline');
        btnNavLogin.classList.add('btn-primary');
        
        // Creamos un botón de "Cerrar Sesión" al lado
        const liSalir = document.createElement('li');
        liSalir.innerHTML = `<a href="#" id="btn-logout-cliente" style="color: var(--accent-color); font-weight: bold; margin-left: 10px; text-decoration: none;">Salir</a>`;
        btnNavLogin.parentElement.after(liSalir);

        // Funcionalidad para cerrar sesión
        document.getElementById('btn-logout-cliente').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('flics_cliente_web');
            window.location.reload(); 
        });
    }

    // 1. CARGAR PRODUCTOS DESDE MYSQL
    async function cargarProductosDesdeBackend() {
        try {
            const respuesta = await fetch(`${API_URL}/productos`);
            if (respuesta.ok) {
                const dataJava = await respuesta.json();
                
                products = dataJava.map(p => ({
                    id: p.idProducto,
                    name: p.nombre,
                    category: p.categoria ? p.categoria.nombre : "General",
                    price: p.precioVenta,
                    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600", 
                    badge: p.stock <= p.stockMinimo ? "¡Poco Stock!" : "",
                    stockReal: p.stock
                }));

                renderPublicProducts();
            }
        } catch (error) {
            console.error("Error conectando con Spring Boot:", error);
            Toast.fire({
                icon: 'error',
                title: 'Error conectando con el servidor'
            });
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
            if (cartItem.quantity < product.stockReal) {
                cartItem.quantity += 1; 
            } else {
                Toast.fire({
                    icon: 'warning',
                    title: 'Stock máximo alcanzado'
                });
                return;
            }
        } 
        else { cart.push({ ...product, quantity: 1 }); }

        saveCart();
        updateCartUi();
        
        Toast.fire({
            icon: 'success',
            title: `"${product.name}" añadido al carrito`
        });
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

    // --- CHECKOUT CON VALIDACIÓN DE USUARIO REGISTRADO ---
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) { 
                Swal.fire({
                    icon: 'warning',
                    title: 'Carrito Vacío',
                    text: 'Agrega algunos productos antes de proceder al pago.',
                    confirmButtonColor: '#00b4d8'
                });
                return; 
            }
            
            const clienteString = localStorage.getItem('flics_cliente_web');
            
            if (!clienteString) {
                Swal.fire({
                    icon: 'info',
                    title: '¡Hola!',
                    text: 'Para procesar tu pedido necesitamos que inicies sesión o te registres.',
                    showCancelButton: true,
                    confirmButtonText: 'Ir al Login',
                    cancelButtonText: 'Seguir mirando',
                    confirmButtonColor: '#00b4d8',
                    cancelButtonColor: '#6c757d'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = 'login-cliente.html';
                    }
                });
                return; 
            }

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
        const clienteActual = JSON.parse(localStorage.getItem('flics_cliente_web'));
        const total = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
        
        const pedidoData = {
            pedido: { 
                estado: "Pendiente", 
                total: total,
                cliente: {
                    idPersona: clienteActual.idPersona 
                }
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
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Pedido Confirmado!',
                    html: `Código de Orden: <b>FL-${pedidoConfirmado.idPedido}</b><br>Método de Pago: <b>${metodo}</b>`,
                    confirmButtonColor: '#22c55e'
                });
                
                cart = [];
                saveCart();
                updateCartUi();
                cargarProductosDesdeBackend(); 
                document.getElementById('payment-modal').classList.remove('show');
            } else {
                throw new Error("El servidor rechazó el pedido.");
            }
        } catch (error) {
            console.error("Error al registrar venta:", error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Hubo un problema procesando tu pedido. Revisa el stock.',
                confirmButtonColor: '#00b4d8'
            });
        }
    }

    // 🚀 INICIO DEL SISTEMA
    updateCartUi();
    cargarProductosDesdeBackend();
});
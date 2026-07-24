document.addEventListener('DOMContentLoaded', () => {

    let products = [];
    let cart = JSON.parse(localStorage.getItem('flics_cart')) || [];
    let deliverySeleccionado = false;

    let filtros = { texto: '', categoria: '', precioMin: null, precioMax: null, orden: 'relevancia' };

    function saveCart() { localStorage.setItem('flics_cart', JSON.stringify(cart)); }

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

    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Cerrar el menú al tocar un link (son anclas a la misma página)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    const btnNavLogin = document.getElementById('btn-nav-login');
    const clienteLogueado = localStorage.getItem('flics_cliente_web');

    if (clienteLogueado && btnNavLogin) {
        const cliente = JSON.parse(clienteLogueado);
        
        btnNavLogin.innerHTML = `<i class="fas fa-user-check"></i> Hola, ${escapeHtml(cliente.nombre.split(' ')[0])}`;
        btnNavLogin.href = "#"; 
        btnNavLogin.classList.remove('btn-primary-outline');
        btnNavLogin.classList.add('btn-primary');

        const liHistorial = document.createElement('li');
        liHistorial.innerHTML = `<a href="historial-pedidos.html" style="font-weight:600;color:var(--primary-color);"><i class="fas fa-box"></i> Mis Pedidos</a>`;
        btnNavLogin.parentElement.parentElement.insertBefore(liHistorial, btnNavLogin.parentElement);

        const liSalir = document.createElement('li');
        liSalir.innerHTML = `<a href="#" id="btn-logout-cliente" style="color: var(--accent-color); font-weight: bold; margin-left: 10px; text-decoration: none;">Salir</a>`;
        btnNavLogin.parentElement.after(liSalir);

        document.getElementById('btn-logout-cliente').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('flics_cliente_web');
            window.location.reload(); 
        });
    }

    async function cargarProductosDesdeBackend() {
        try {
            const respuesta = await apiFetch('/productos');
            if (respuesta.ok) {
                const dataJava = await respuesta.json();
                
                products = dataJava.map(p => ({
                    id: p.idProducto,
                    name: p.nombre,
                    category: p.categoria ? p.categoria.nombre : "General",
                    price: p.precioVenta,
                    image: p.imagenUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600",
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

    async function cargarCategoriasDesdeBackend() {
        const container = document.getElementById('categories-container');
        if (!container) return;

        try {
            const respuesta = await apiFetch('/categorias');
            if (!respuesta.ok) throw new Error('No se pudo cargar categorías');
            const categorias = await respuesta.json();

            if (categorias.length === 0) {
                container.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 20px;">No hay categorías registradas.</p>';
                return;
            }

            container.innerHTML = categorias.map(cat => `
                <div class="category-card">
                    <img src="${escapeHtml(cat.imagenUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600')}"
                        alt="${escapeHtml(cat.nombre)}" class="category-img" loading="lazy">
                    <div class="category-content">
                        <h3>${escapeHtml(cat.nombre)}</h3>
                        <a href="#productos" class="category-link" data-categoria="${escapeHtml(cat.nombre)}">Ver más ➔</a>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.category-link').forEach(link => {
                link.addEventListener('click', () => seleccionarCategoria(link.dataset.categoria));
            });

            renderCategoryChips(categorias.map(c => c.nombre));
        } catch (error) {
            console.error('Error cargando categorías:', error);
            container.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 20px;">No se pudieron cargar las categorías.</p>';
        }
    }

    const chipsContainer = document.getElementById('categorias-chips');

    function renderCategoryChips(nombresCategorias) {
        if (!chipsContainer) return;
        chipsContainer.innerHTML = '<button class="category-chip active" data-categoria="">Todas</button>' +
            nombresCategorias.map(nombre => `<button class="category-chip" data-categoria="${escapeHtml(nombre)}">${escapeHtml(nombre)}</button>`).join('');

        chipsContainer.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => seleccionarCategoria(chip.dataset.categoria));
        });
    }

    function seleccionarCategoria(categoria) {
        filtros.categoria = categoria || '';
        if (chipsContainer) {
            chipsContainer.querySelectorAll('.category-chip').forEach(chip => {
                chip.classList.toggle('active', chip.dataset.categoria === filtros.categoria);
            });
        }
        document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        renderPublicProducts();
    }

    const productsContainer = document.getElementById('products-container');
    const resultadosInfo = document.getElementById('filtro-resultados-info');

    function normalizarTexto(texto) {
        return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function obtenerProductosFiltrados() {
        let resultado = products.filter(product => {
            if (filtros.texto && !normalizarTexto(product.name).includes(normalizarTexto(filtros.texto))) return false;
            if (filtros.categoria && product.category !== filtros.categoria) return false;
            if (filtros.precioMin !== null && product.price < filtros.precioMin) return false;
            if (filtros.precioMax !== null && product.price > filtros.precioMax) return false;
            return true;
        });

        if (filtros.orden === 'precio-asc') resultado.sort((a, b) => a.price - b.price);
        else if (filtros.orden === 'precio-desc') resultado.sort((a, b) => b.price - a.price);
        else if (filtros.orden === 'nombre-asc') resultado.sort((a, b) => a.name.localeCompare(b.name));

        return resultado;
    }

    function renderPublicProducts() {
        if (!productsContainer) return;
        productsContainer.innerHTML = '';

        if (products.length === 0) {
            productsContainer.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 40px;">No hay productos en la base de datos.</p>';
            if (resultadosInfo) resultadosInfo.textContent = '';
            return;
        }

        const productosFiltrados = obtenerProductosFiltrados();

        if (resultadosInfo) {
            const hayFiltrosActivos = filtros.texto || filtros.categoria || filtros.precioMin !== null || filtros.precioMax !== null;
            resultadosInfo.textContent = hayFiltrosActivos
                ? `${productosFiltrados.length} de ${products.length} productos`
                : '';
        }

        if (productosFiltrados.length === 0) {
            productsContainer.innerHTML = `
                <div class="no-products-found">
                    <i class="fas fa-search"></i>
                    <h3>No se encontraron productos</h3>
                    <p>Prueba con otra búsqueda o quita algunos filtros.</p>
                </div>
            `;
            return;
        }

        productosFiltrados.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            card.innerHTML = `
                ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ''}
                <div class="product-img-container">
                    <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="product-img" loading="lazy">
                </div>
                <div class="product-info">
                    <span class="product-cat">${escapeHtml(product.category)}</span>
                    <h3 class="product-title">${escapeHtml(product.name)}</h3>
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

    const filtroBusqueda = document.getElementById('filtro-busqueda');
    const filtroPrecioMin = document.getElementById('filtro-precio-min');
    const filtroPrecioMax = document.getElementById('filtro-precio-max');
    const filtroOrden = document.getElementById('filtro-orden');
    const filtroLimpiar = document.getElementById('filtro-limpiar');

    let debounceBusqueda;
    filtroBusqueda?.addEventListener('input', () => {
        clearTimeout(debounceBusqueda);
        debounceBusqueda = setTimeout(() => {
            filtros.texto = filtroBusqueda.value.trim();
            renderPublicProducts();
        }, 250);
    });

    filtroPrecioMin?.addEventListener('input', () => {
        filtros.precioMin = filtroPrecioMin.value === '' ? null : Number(filtroPrecioMin.value);
        renderPublicProducts();
    });

    filtroPrecioMax?.addEventListener('input', () => {
        filtros.precioMax = filtroPrecioMax.value === '' ? null : Number(filtroPrecioMax.value);
        renderPublicProducts();
    });

    filtroOrden?.addEventListener('change', () => {
        filtros.orden = filtroOrden.value;
        renderPublicProducts();
    });

    filtroLimpiar?.addEventListener('click', () => {
        filtros = { texto: '', categoria: '', precioMin: null, precioMax: null, orden: 'relevancia' };
        if (filtroBusqueda) filtroBusqueda.value = '';
        if (filtroPrecioMin) filtroPrecioMin.value = '';
        if (filtroPrecioMax) filtroPrecioMax.value = '';
        if (filtroOrden) filtroOrden.value = 'relevancia';
        chipsContainer?.querySelectorAll('.category-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.categoria === '');
        });
        renderPublicProducts();
    });

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

    function calcularSubtotalCarrito() {
        return cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    }

    function updateCartUi() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        let total = calcularSubtotalCarrito();
        let count = 0;

        cart.forEach(item => {
            count += item.quantity;

            const div = document.createElement('div');
            div.classList.add('cart-item');
            div.innerHTML = `
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">${item.quantity} x S/ ${Number(item.price).toFixed(2)}</div>
                </div>
                <button class="btn-remove" style="background:none; border:none; color:var(--accent-color); cursor:pointer;" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            `;
            cartItemsContainer.appendChild(div);
        });

        const deliveryCosto = deliverySeleccionado ? 5.00 : 0;
        const totalConDelivery = total + deliveryCosto;

        let deliveryHtml = '';
        if (deliverySeleccionado) {
            deliveryHtml = `
                <div class="cart-item" style="border-bottom: none; padding: 8px 0;">
                    <div style="display:flex;justify-content:space-between;width:100%;">
                        <span style="color:#16a34a;"><i class="fas fa-truck"></i> Delivery</span>
                        <span style="color:#16a34a;">+ S/ 5.00</span>
                    </div>
                </div>
            `;
        }

        const deliveryLine = document.getElementById('delivery-line');
        if (deliveryLine) deliveryLine.remove();

        const totalDiv = document.createElement('div');
        totalDiv.id = 'delivery-line';
        totalDiv.innerHTML = deliveryHtml;
        if (cartItemsContainer.lastChild) {
            cartItemsContainer.appendChild(totalDiv);
        } else {
            cartItemsContainer.appendChild(totalDiv);
        }

        if (cartCountEl) cartCountEl.textContent = count;
        if (cartTotalPriceEl) cartTotalPriceEl.textContent = `S/ ${totalConDelivery.toFixed(2)}`;
        window._currentCartTotal = totalConDelivery;

        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                cart = cart.filter(item => item.id !== id);
                saveCart();
                updateCartUi();
            });
        });
    }

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
            document.getElementById('delivery-modal').classList.add('show');
        });
    }

    document.getElementById('close-payment')?.addEventListener('click', () => document.getElementById('payment-modal').classList.remove('show'));
    document.getElementById('close-yape')?.addEventListener('click', () => document.getElementById('yape-modal').classList.remove('show'));
    document.getElementById('close-delivery')?.addEventListener('click', () => document.getElementById('delivery-modal').classList.remove('show'));

    document.getElementById('confirm-delivery')?.addEventListener('click', () => {
        const check = document.getElementById('delivery-check');
        deliverySeleccionado = check.checked;
        updateCartUi();
        document.getElementById('delivery-modal').classList.remove('show');
        document.getElementById('payment-modal').classList.add('show');
    });

    document.getElementById('pay-cash')?.addEventListener('click', () => finalizarPedido('Efectivo'));
    document.getElementById('pay-yape')?.addEventListener('click', () => {
        document.getElementById('payment-modal').classList.remove('show');
        document.getElementById('yape-modal').classList.add('show');

        const monto = (window._currentCartTotal || 0).toFixed(2);
        const amountEl = document.getElementById('yape-amount-value');
        if (amountEl) amountEl.textContent = `S/ ${monto}`;

        const whatsappBtn = document.getElementById('whatsapp-evidence-btn');
        if (whatsappBtn) {
            const mensaje = encodeURIComponent(`Hola, les envío la evidencia de mi pago por Yape de S/ ${monto}.`);
            whatsappBtn.href = `https://wa.me/51936029607?text=${mensaje}`;
        }
    });
    document.getElementById('confirm-yape')?.addEventListener('click', () => {
        document.getElementById('yape-modal').classList.remove('show');
        finalizarPedido('Yape');
    });

    async function finalizarPedido(metodo) {
        const clienteActual = JSON.parse(localStorage.getItem('flics_cliente_web'));
        const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
        const costoDelivery = deliverySeleccionado ? 5.00 : 0;
        const total = subtotal + costoDelivery;
        
        const pedidoData = {
            pedido: { 
                estado: "Pendiente", 
                total: total,
                delivery: deliverySeleccionado,
                costoDelivery: costoDelivery,
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
            const respuesta = await apiFetch('/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedidoData)
            });

            if (respuesta.ok) {
                const pedidoConfirmado = await respuesta.json();
                let htmlMsg = `Código de Orden: <b>FL-${pedidoConfirmado.idPedido}</b><br>Método de Pago: <b>${metodo}</b>`;
                if (deliverySeleccionado) {
                    htmlMsg += `<br><span style="color:#16a34a;"><i class="fas fa-truck"></i> Con Delivery (+S/ 5.00)</span>`;
                }

                Swal.fire({
                    icon: 'success',
                    title: '¡Pedido Confirmado!',
                    html: htmlMsg,
                    confirmButtonColor: '#22c55e'
                });
                
                cart = [];
                deliverySeleccionado = false;
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

    updateCartUi();
    cargarProductosDesdeBackend();
    cargarCategoriasDesdeBackend();
});

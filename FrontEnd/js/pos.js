document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SEGURIDAD: Validar que sea VENDEDOR o ADMIN
    const usuarioString = localStorage.getItem('flics_usuario');
    if (!usuarioString) {
        window.location.href = 'login.html';
        return;
    }
    
    const usuarioActual = JSON.parse(usuarioString);
    if (usuarioActual.rol !== 'VENDEDOR' && usuarioActual.rol !== 'ADMIN') {
        alert("Acceso denegado. Pantalla exclusiva para personal de caja.");
        window.location.href = 'login.html';
        return;
    }

    // Mostrar el usuario activo
    document.getElementById('pos-user-name').innerHTML = `<i class="fas fa-user-circle"></i> Caja: ${usuarioActual.idUsuario}`;

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('flics_usuario');
        window.location.href = 'login-personal.html';
    });

    // --- VARIABLES Y CONEXIÓN ---
    const API_URL = window.BACKEND_API_URL || 'http://localhost:8080/api';
    let catalogo = [];
    let boleta = []; // Es como el carrito, pero para la tienda física

    // 2. CARGAR PRODUCTOS
    async function cargarProductosPOS() {
        try {
            const res = await fetch(`${API_URL}/productos`);
            if (res.ok) {
                catalogo = await res.json();
                renderizarGrilla(catalogo);
            }
        } catch (error) {
            alert("Error al conectar con la base de datos de productos.");
        }
    }

    function renderizarGrilla(productosArray) {
        const grid = document.getElementById('pos-grid');
        grid.innerHTML = '';

        productosArray.forEach(prod => {
            // Solo mostramos productos activos y con stock
            if (prod.stock > 0) {
                const item = document.createElement('div');
                item.className = 'pos-item';
                item.innerHTML = `
                    <div class="pos-item-title">${prod.nombre}</div>
                    <div class="pos-item-price">S/ ${prod.precioVenta.toFixed(2)}</div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 5px;">Stock: ${prod.stock}</div>
                `;
                // Al hacer clic, se agrega a la boleta directamente
                item.addEventListener('click', () => agregarABoleta(prod));
                grid.appendChild(item);
            }
        });
    }

    // 3. BUSCADOR EN TIEMPO REAL
    document.getElementById('pos-search').addEventListener('input', (e) => {
        const texto = e.target.value.toLowerCase();
        const filtrados = catalogo.filter(p => 
            p.nombre.toLowerCase().includes(texto) || 
            (p.codigoBarras && p.codigoBarras.toLowerCase().includes(texto))
        );
        renderizarGrilla(filtrados);
    });

    // 4. LÓGICA DE LA BOLETA
    function agregarABoleta(producto) {
        const itemExistente = boleta.find(i => i.idProducto === producto.idProducto);
        
        if (itemExistente) {
            if (itemExistente.cantidad < producto.stock) {
                itemExistente.cantidad++;
            } else {
                alert("Stock insuficiente para este producto.");
            }
        } else {
            boleta.push({
                idProducto: producto.idProducto,
                nombre: producto.nombre,
                precio: producto.precioVenta,
                cantidad: 1
            });
        }
        actualizarTicketUI();
    }

    window.modificarCantidad = function(idProd, delta) {
        const item = boleta.find(i => i.idProducto === idProd);
        if (!item) return;

        const productoBD = catalogo.find(p => p.idProducto === idProd);

        item.cantidad += delta;

        if (item.cantidad <= 0) {
            boleta = boleta.filter(i => i.idProducto !== idProd);
        } else if (item.cantidad > productoBD.stock) {
            item.cantidad = productoBD.stock;
            alert("Has alcanzado el límite de stock de este producto.");
        }
        
        actualizarTicketUI();
    }

    window.limpiarBoleta = function() {
        if(boleta.length > 0 && confirm("¿Está seguro de limpiar la boleta actual?")) {
            boleta = [];
            actualizarTicketUI();
        }
    }

    function actualizarTicketUI() {
        const container = document.getElementById('ticket-items');
        const totalEl = document.getElementById('ticket-total-price');
        
        if (boleta.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #94a3b8; margin-top: 20px; font-size: 0.9rem;">Agregue productos para comenzar</p>';
            totalEl.textContent = 'S/ 0.00';
            return;
        }

        container.innerHTML = '';
        let total = 0;

        boleta.forEach(item => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;

            container.innerHTML += `
                <div class="ticket-row">
                    <div class="ticket-row-title">${item.nombre}</div>
                    <div class="ticket-row-qty">
                        <button class="btn-qty" onclick="modificarCantidad(${item.idProducto}, -1)">-</button>
                        <span>${item.cantidad}</span>
                        <button class="btn-qty" onclick="modificarCantidad(${item.idProducto}, 1)">+</button>
                    </div>
                    <div class="ticket-row-price">S/ ${subtotal.toFixed(2)}</div>
                </div>
            `;
        });

        totalEl.textContent = `S/ ${total.toFixed(2)}`;
    }

    // 5. ENVIAR VENTA A JAVA (Backend)
    window.procesarVenta = async function(idMetodoPago) {
        if (boleta.length === 0) {
            alert("La boleta está vacía.");
            return;
        }

        const total = boleta.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

        // Estructura que espera tu VentaController
        const ventaData = {
            venta: {
                total: total,
                vendedor: { idPersona: usuarioActual.idPersona }, // El empleado que está logueado
                metodoPago: { idMetodo: idMetodoPago } // 1 Efectivo, 2 Yape
                // Nota: Cliente es opcional en la BD para ventas presenciales rápidas
            },
            detalles: boleta.map(item => ({
                producto: { idProducto: item.idProducto },
                cantidad: item.cantidad,
                precioUnidad: item.precio,
                subtotal: (item.precio * item.cantidad)
            }))
        };

        try {
            const res = await fetch(`${API_URL}/ventas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ventaData)
            });

            if (res.ok) {
                const ventaConfirmada = await res.json();
                alert(`¡Venta #${ventaConfirmada.idVenta} registrada correctamente!`);
                boleta = [];
                actualizarTicketUI();
                cargarProductosPOS(); // Recargamos para refrescar el stock físico
            } else {
                alert("Error al procesar la venta. Verifique la base de datos.");
            }
        } catch (error) {
            alert("Error de conexión con el servidor.");
        }
    }

    // Iniciar
    cargarProductosPOS();
});
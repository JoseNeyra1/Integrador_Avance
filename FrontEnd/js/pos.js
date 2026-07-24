document.addEventListener('DOMContentLoaded', () => {
    
    const usuarioString = localStorage.getItem('flics_usuario');
    if (!usuarioString) {
        window.location.href = 'login-personal.html';
        return;
    }
    
    const usuarioActual = JSON.parse(usuarioString);
    if (usuarioActual.rol !== 'VENDEDOR' && usuarioActual.rol !== 'ADMIN') {
        Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text: 'Pantalla exclusiva para personal de caja.',
            confirmButtonColor: '#dc2626'
        }).then(() => {
            window.location.href = 'login-personal.html';
        });
        return;
    }

    document.getElementById('pos-user-name').innerHTML = `<i class="fas fa-user-circle"></i> Caja: ${escapeHtml(usuarioActual.idUsuario)}`;

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('flics_usuario');
        window.location.href = 'login-personal.html';
    });

    let catalogo = [];
    let boleta = [];

    const Toast = Swal.mixin({
        toast: true, position: 'bottom-end', showConfirmButton: false, timer: 2000, timerProgressBar: true
    });

    async function cargarProductosPOS() {
        try {
            const res = await apiFetch('/productos');
            if (res.ok) {
                catalogo = await res.json();
                renderizarGrilla(catalogo);
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con la base de datos.' });
        }
    }

    function renderizarGrilla(productosArray) {
        const grid = document.getElementById('pos-grid');
        grid.innerHTML = '';

        productosArray.forEach(prod => {
            if (prod.stock > 0) {
                const item = document.createElement('div');
                item.className = 'pos-item';
                item.innerHTML = `
                    <div class="pos-item-title">${escapeHtml(prod.nombre)}</div>
                    <div class="pos-item-price">S/ ${prod.precioVenta.toFixed(2)}</div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 5px;">Stock: ${prod.stock}</div>
                `;
                item.addEventListener('click', () => agregarABoleta(prod));
                grid.appendChild(item);
            }
        });
    }

    document.getElementById('pos-search').addEventListener('input', (e) => {
        const texto = e.target.value.toLowerCase();
        const filtrados = catalogo.filter(p => 
            p.nombre.toLowerCase().includes(texto) || 
            (p.codigoBarras && p.codigoBarras.toLowerCase().includes(texto))
        );
        renderizarGrilla(filtrados);
    });

    function agregarABoleta(producto) {
        const itemExistente = boleta.find(i => i.idProducto === producto.idProducto);
        
        if (itemExistente) {
            if (itemExistente.cantidad < producto.stock) {
                itemExistente.cantidad++;
            } else {
                Toast.fire({ icon: 'warning', title: 'Stock insuficiente' });
                return;
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
        Toast.fire({ icon: 'success', title: `${producto.nombre} agregado` });
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
            Toast.fire({ icon: 'warning', title: 'Stock máximo alcanzado' });
        }
        
        actualizarTicketUI();
    }

    window.limpiarBoleta = function() {
        if (boleta.length === 0) return;
        Swal.fire({
            title: '¿Cancelar venta?',
            text: 'Los productos de la boleta se perderán.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'Volver',
            confirmButtonColor: '#ef4444'
        }).then((result) => {
            if (result.isConfirmed) {
                boleta = [];
                actualizarTicketUI();
                Toast.fire({ icon: 'info', title: 'Venta cancelada' });
            }
        });
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
                    <div class="ticket-row-title">${escapeHtml(item.nombre)}</div>
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

    window.procesarVenta = async function(idMetodoPago) {
        if (boleta.length === 0) {
            Toast.fire({ icon: 'warning', title: 'La boleta está vacía' });
            return;
        }

        if (!usuarioActual.idPersona) {
            Swal.fire({
                icon: 'error', title: 'Error de sesión',
                text: 'No se encontró el ID del vendedor. Vuelve a iniciar sesión.'
            });
            return;
        }

        const total = boleta.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const metodoNombre = idMetodoPago === 1 ? 'Efectivo' : 'Yape';

        const result = await Swal.fire({
            title: `¿Confirmar venta?`,
            html: `Total: <b>S/ ${total.toFixed(2)}</b><br>Método: <b>${metodoNombre}</b>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cobrar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#22c55e'
        });

        if (!result.isConfirmed) return;

        const ventaData = {
            venta: {
                total: total,
                vendedor: { idPersona: usuarioActual.idPersona },
                metodoPago: { idMetodo: idMetodoPago }
            },
            detalles: boleta.map(item => ({
                producto: { idProducto: item.idProducto },
                cantidad: item.cantidad,
                precioUnidad: item.precio,
                subtotal: (item.precio * item.cantidad)
            }))
        };

        try {
            const res = await apiFetch('/ventas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ventaData)
            });

            if (res.ok) {
                const ventaConfirmada = await res.json();
                const pagoIcon = idMetodoPago === 1 ? '💵' : '📱';
                document.getElementById('receipt-details').innerHTML = `
                    <p style="font-size:2.5rem;margin:10px 0;">🧾</p>
                    <p style="font-size:1.3rem;font-weight:bold;">Venta #${ventaConfirmada.idVenta}</p>
                    <p style="font-size:1rem;color:var(--text-muted);">${new Date().toLocaleString()}</p>
                    <p style="font-size:1.2rem;font-weight:bold;color:var(--primary-color);margin:10px 0;">S/ ${Number(ventaConfirmada.total).toFixed(2)}</p>
                    <p>${pagoIcon} ${metodoNombre}</p>
                    <p style="font-size:0.85rem;color:var(--text-muted);">Atendió: ${escapeHtml(usuarioActual.idUsuario)}</p>
                `;
                document.getElementById('receipt-modal').classList.add('show');

                boleta = [];
                actualizarTicketUI();
                cargarProductosPOS();
            } else {
                const err = await res.text();
                Swal.fire({ icon: 'error', title: 'Error', text: err || 'Error al procesar la venta' });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error de conexión con el servidor.' });
        }
    }

    document.getElementById('btn-new-sale')?.addEventListener('click', () => {
        document.getElementById('receipt-modal').classList.remove('show');
    });

    document.querySelectorAll('.modal .close-modal, .modal .close').forEach(el => {
        if (el) el.addEventListener('click', () => {
            document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
        });
    });

    actualizarTicketUI();
    cargarProductosPOS();
});

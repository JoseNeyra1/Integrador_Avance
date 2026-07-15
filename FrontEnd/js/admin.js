document.addEventListener('DOMContentLoaded', () => {
    
    const usuarioString = localStorage.getItem('flics_usuario');
    if (!usuarioString) {
        window.location.href = 'login-personal.html';
        return;
    }
    
    const usuarioActual = JSON.parse(usuarioString);
    if (usuarioActual.rol !== 'ADMIN') {
        alert("Acceso denegado. No tienes privilegios de Administrador.");
        window.location.href = 'login-personal.html';
        return;
    }

    document.getElementById('admin-name-display').textContent = `Hola, ${usuarioActual.idUsuario}`;

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('flics_usuario');
        window.location.href = 'login-personal.html';
    });

    let productosCache = [];
    let categoriasCache = [];

    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const currentTabId = btn.dataset.tab;
            document.getElementById(currentTabId).classList.add('active');
            
            if (currentTabId === 'tab-productos') { cargarProductos(); cargarCategoriasParaSelect(); }
            if (currentTabId === 'tab-pedidos') cargarPedidos();
            if (currentTabId === 'tab-categorias') cargarCategorias();
            if (currentTabId === 'tab-graficos') generarGraficos();
        });
    });

    async function cargarCategorias() {
        const container = document.getElementById('admin-categorias-container');
        container.innerHTML = '<p>Cargando categorías...</p>';
        try {
            const res = await apiFetch('/categorias');
            if (res.ok) {
                categoriasCache = await res.json();
                container.innerHTML = categoriasCache.length === 0
                    ? '<p>No hay categorías registradas.</p>'
                    : categoriasCache.map(c => `
                        <div class="admin-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px 15px;margin-bottom:8px;">
                            <div>
                                <span style="font-weight:600;">${c.nombre}</span>
                                <span style="font-size:0.85rem;color:var(--text-muted);margin-left:8px;">ID: ${c.idCategoria}</span>
                            </div>
                            <div style="display:flex;gap:6px;">
                                <button class="btn-editar-categoria" data-id="${c.idCategoria}" data-nombre="${c.nombre}" style="background:none;border:1px solid #ddd;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.8rem;">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-eliminar-categoria" data-id="${c.idCategoria}" style="background:none;border:1px solid #ddd;color:#dc2626;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.8rem;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('');

                document.querySelectorAll('.btn-editar-categoria').forEach(btn => {
                    btn.addEventListener('click', () => editarCategoria(parseInt(btn.dataset.id), btn.dataset.nombre));
                });
                document.querySelectorAll('.btn-eliminar-categoria').forEach(btn => {
                    btn.addEventListener('click', () => eliminarCategoria(parseInt(btn.dataset.id)));
                });
            }
        } catch (error) {
            container.innerHTML = '<p style="color:red;">Error al cargar categorías.</p>';
        }
    }

    async function editarCategoria(id, nombreActual) {
        const { value: nombre } = await Swal.fire({
            title: 'Editar categoría',
            input: 'text',
            inputValue: nombreActual,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar'
        });
        if (!nombre || !nombre.trim()) return;

        try {
            const res = await apiFetch(`/categorias/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombre.trim() })
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Categoría actualizada', timer: 1500, showConfirmButton: false });
                cargarCategorias();
                cargarCategoriasParaSelect();
            } else {
                Swal.fire({ icon: 'error', title: 'Error al actualizar' });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error de conexión' });
        }
    }

    async function eliminarCategoria(id) {
        const result = await Swal.fire({
            icon: 'warning', title: '¿Eliminar categoría?',
            text: 'Solo se puede eliminar si no tiene productos activos asociados.',
            showCancelButton: true, confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar', confirmButtonColor: '#dc2626'
        });
        if (!result.isConfirmed) return;

        try {
            const res = await apiFetch(`/categorias/${id}`, { method: 'DELETE' });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Categoría eliminada', timer: 1500, showConfirmButton: false });
                cargarCategorias();
                cargarCategoriasParaSelect();
            } else {
                const err = await res.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: err.error || '' });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error de conexión' });
        }
    }

    async function cargarCategoriasParaSelect() {
        try {
            const res = await apiFetch('/categorias');
            if (res.ok) {
                categoriasCache = await res.json();
                const selects = ['new-category-select', 'edit-category'];
                selects.forEach(id => {
                    const sel = document.getElementById(id);
                    if (!sel) return;
                    const valActual = sel.value;
                    sel.innerHTML = '<option value="">Seleccionar...</option>';
                    categoriasCache.forEach(c => {
                        sel.innerHTML += `<option value="${c.idCategoria}">${c.nombre}</option>`;
                    });
                    if (valActual) sel.value = valActual;
                });
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    }

    async function cargarProductos() {
        const container = document.getElementById('admin-products-container');
        container.innerHTML = '<p>Cargando inventario...</p>';
        
        try {
            const res = await apiFetch('/productos');
            if (res.ok) {
                productosCache = await res.json();
                container.innerHTML = '';
                
                productosCache.forEach(product => {
                    const imgPreview = product.imagenUrl
                        ? `<img src="${product.imagenUrl}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;margin-right:10px;" onerror="this.style.display='none'">`
                        : '';

                    const div = document.createElement('div');
                    div.className = 'admin-item';
                    div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 15px;';
                    div.innerHTML = `
                        <div style="display:flex;align-items:center;flex:2;">
                            ${imgPreview}
                            <div>
                                <div style="font-weight:bold;">${product.nombre}</div>
                                <div style="font-size:0.85rem;color:#666;">
                                    ${product.categoria ? product.categoria.nombre : 'N/A'} | Stock: ${product.stock}
                                </div>
                            </div>
                        </div>
                        <div style="text-align:right;flex-shrink:0;">
                            <div style="color:var(--primary-color);font-weight:bold;">S/ ${product.precioVenta.toFixed(2)}</div>
                            <button class="btn-editar-producto" data-id="${product.idProducto}" style="background:none;border:1px solid #ddd;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.8rem;margin-top:4px;">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </div>
                    `;
                    container.appendChild(div);
                });

                document.querySelectorAll('.btn-editar-producto').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const id = parseInt(btn.dataset.id);
                        abrirEditor(id);
                    });
                });
            }
        } catch (error) {
            container.innerHTML = '<p style="color:red;">Error al cargar datos desde Spring Boot.</p>';
        }
    }

    function abrirEditor(id) {
        const producto = productosCache.find(p => p.idProducto === id);
        if (!producto) return;

        document.getElementById('edit-id').value = producto.idProducto;
        document.getElementById('edit-name').value = producto.nombre || '';
        document.getElementById('edit-price').value = producto.precioVenta || '';
        document.getElementById('edit-stock').value = producto.stock || '';
        document.getElementById('edit-image').value = producto.imagenUrl || '';

        cargarCategoriasParaSelect().then(() => {
            if (producto.categoria) {
                document.getElementById('edit-category').value = producto.categoria.idCategoria;
            }
        });

        document.getElementById('edit-modal').classList.add('show');
    }

    document.getElementById('close-edit')?.addEventListener('click', () => document.getElementById('edit-modal').classList.remove('show'));
    document.getElementById('cancel-edit-btn')?.addEventListener('click', () => document.getElementById('edit-modal').classList.remove('show'));

    document.getElementById('save-edit-btn')?.addEventListener('click', async () => {
        const id = parseInt(document.getElementById('edit-id').value);
        const nombre = document.getElementById('edit-name').value.trim();
        const precio = parseFloat(document.getElementById('edit-price').value);
        const stock = parseInt(document.getElementById('edit-stock').value);
        const idCategoria = parseInt(document.getElementById('edit-category').value);
        const imagenUrl = document.getElementById('edit-image').value.trim();

        if (!nombre || isNaN(precio) || isNaN(stock) || isNaN(idCategoria)) {
            Swal.fire({ icon: 'warning', title: 'Completa todos los campos requeridos' });
            return;
        }

        try {
            const res = await apiFetch(`/productos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nombre,
                    precioVenta: precio,
                    stock: stock,
                    stockMinimo: 5,
                    imagenUrl: imagenUrl || null,
                    activo: true,
                    categoria: { idCategoria: idCategoria }
                })
            });

            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Producto actualizado', timer: 1500, showConfirmButton: false });
                document.getElementById('edit-modal').classList.remove('show');
                cargarProductos();
            } else {
                Swal.fire({ icon: 'error', title: 'Error al actualizar' });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error de conexión' });
        }
    });

    let paginaPedidosActual = 0;
    const FLUJO_ESTADOS = ['Pendiente', 'Preparacion', 'Listo', 'Entregado'];

    function getSiguienteEstado(actual) {
        const idx = FLUJO_ESTADOS.indexOf(actual);
        if (idx === -1 || idx >= FLUJO_ESTADOS.length - 1) return null;
        return FLUJO_ESTADOS[idx + 1];
    }

    function renderStepper(estadoActual, idPedido) {
        const esTerminal = estadoActual === 'Entregado' || estadoActual === 'Cancelado';
        let pasosHtml = '';
        FLUJO_ESTADOS.forEach((estado, i) => {
            const idxActual = FLUJO_ESTADOS.indexOf(estadoActual);
            let clase = 'stepper-step';
            if (i < idxActual) clase += ' completed';
            else if (i === idxActual) clase += ' active';
            else clase += ' pending';

            pasosHtml += `
                <div class="${clase}">
                    <div class="stepper-circle">${i < idxActual ? '<i class="fas fa-check"></i>' : i + 1}</div>
                    <div class="stepper-label">${estado}</div>
                </div>
                ${i < FLUJO_ESTADOS.length - 1 ? '<div class="stepper-line"></div>' : ''}
            `;
        });

        const siguiente = getSiguienteEstado(estadoActual);
        let botonAvanzar = '';
        if (siguiente && !esTerminal) {
            botonAvanzar = `<button class="btn-avanzar" data-pedido="${idPedido}" data-estado="${siguiente}">
                <i class="fas fa-arrow-right"></i> Avanzar a "${siguiente}"
            </button>`;
        }

        let botonCancelar = '';
        if (!esTerminal && estadoActual !== 'Cancelado') {
            botonCancelar = `<button class="btn-cancelar-pedido" data-pedido="${idPedido}">
                <i class="fas fa-times"></i> Cancelar Pedido
            </button>`;
        }

        return `
            <div class="stepper-container">${pasosHtml}</div>
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                ${botonAvanzar}
                ${botonCancelar}
                <button class="btn-ver-timeline" data-pedido="${idPedido}" style="background:none;border:1px solid #ddd;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.85rem;">
                    <i class="fas fa-clock"></i> Ver Timeline
                </button>
            </div>
        `;
    }

    async function cargarPedidos(pagina = 0) {
        paginaPedidosActual = pagina;
        const container = document.getElementById('admin-orders-container');
        container.innerHTML = '<p>Cargando historial...</p>';

        try {
            const res = await apiFetch(`/pedidos?page=${pagina}&size=10`);
            if (res.ok) {
                const data = await res.json();
                const pedidosBd = data.content;
                container.innerHTML = '<div id="orders-list"></div>';
                const list = document.getElementById('orders-list');

                if (pedidosBd.length === 0) {
                    list.innerHTML = '<p>No hay pedidos registrados.</p>';
                    return;
                }

                pedidosBd.forEach(order => {
                    const fecha = new Date(order.fecha).toLocaleString();
                    const deliveryHtml = order.delivery
                        ? `<span style="color:#16a34a;font-size:0.85rem;"><i class="fas fa-truck"></i> Delivery (+S/ ${Number(order.costoDelivery).toFixed(2)})</span>`
                        : '';

                    const card = document.createElement('div');
                    card.className = 'order-card-admin';
                    card.innerHTML = `
                        <div class="order-card-header-admin">
                            <div class="order-card-info">
                                <span class="order-card-id">#WEB-${order.idPedido}</span>
                                ${deliveryHtml}
                                <span class="order-card-date">${fecha}</span>
                            </div>
                            <div class="order-card-total">S/ ${Number(order.total).toFixed(2)}</div>
                        </div>
                        ${order.cliente ? `<div class="order-card-client">Cliente: ID ${order.cliente.idPersona}</div>` : ''}
                        <div id="timeline-${order.idPedido}" class="admin-timeline" style="display:none;">
                            <div style="font-size:0.85rem;color:var(--text-muted);padding:4px 0;">Cargando línea de tiempo...</div>
                        </div>
                        <div class="order-card-actions">
                            ${renderStepper(order.estado, order.idPedido)}
                        </div>
                    `;
                    list.appendChild(card);
                });

                document.querySelectorAll('.btn-avanzar').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        await cambiarEstado(parseInt(btn.dataset.pedido), btn.dataset.estado);
                    });
                });

                document.querySelectorAll('.btn-cancelar-pedido').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const id = parseInt(btn.dataset.pedido);
                        const result = await Swal.fire({
                            icon: 'warning', title: '¿Cancelar pedido?',
                            text: 'Esta acción no se puede deshacer.',
                            showCancelButton: true, confirmButtonText: 'Sí, cancelar',
                            cancelButtonText: 'Volver', confirmButtonColor: '#dc2626'
                        });
                        if (result.isConfirmed) await cambiarEstado(id, 'Cancelado');
                    });
                });

                document.querySelectorAll('.btn-ver-timeline').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const id = parseInt(btn.dataset.pedido);
                        const tlDiv = document.getElementById(`timeline-${id}`);
                        if (tlDiv.style.display === 'none') {
                            tlDiv.style.display = 'block';
                            btn.innerHTML = '<i class="fas fa-clock"></i> Ocultar Timeline';
                            cargarTimeline(id);
                        } else {
                            tlDiv.style.display = 'none';
                            btn.innerHTML = '<i class="fas fa-clock"></i> Ver Timeline';
                        }
                    });
                });

                const paginacionDiv = document.createElement('div');
                paginacionDiv.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:10px;margin-top:15px;';
                paginacionDiv.innerHTML = `
                    <button id="btn-pag-prev" ${data.first ? 'disabled' : ''} style="padding:6px 14px;border-radius:8px;border:1px solid #ddd;cursor:pointer;">« Anterior</button>
                    <span style="font-size:0.85rem;color:var(--text-muted);">Página ${data.number + 1} de ${Math.max(data.totalPages, 1)}</span>
                    <button id="btn-pag-next" ${data.last ? 'disabled' : ''} style="padding:6px 14px;border-radius:8px;border:1px solid #ddd;cursor:pointer;">Siguiente »</button>
                `;
                container.appendChild(paginacionDiv);
                paginacionDiv.querySelector('#btn-pag-prev').addEventListener('click', () => { if (!data.first) cargarPedidos(pagina - 1); });
                paginacionDiv.querySelector('#btn-pag-next').addEventListener('click', () => { if (!data.last) cargarPedidos(pagina + 1); });
            }
        } catch (error) {
            container.innerHTML = '<p style="color:red;">Error al cargar pedidos.</p>';
        }
    }

    async function cambiarEstado(idPedido, nuevoEstado) {
        try {
            const res = await apiFetch(`/pedidos/${idPedido}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            if (res.ok) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'success', title: 'Estado actualizado', timer: 1500, showConfirmButton: false });
                }
                cargarPedidos(paginaPedidosActual);
            } else {
                const err = await res.json();
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'error', title: 'Error', text: err.error || 'No se pudo actualizar' });
                }
            }
        } catch (error) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Error de conexión' });
            }
        }
    }

    async function cargarTimeline(idPedido) {
        try {
            const res = await apiFetch(`/pedidos/${idPedido}/historial`);
            if (!res.ok) return;
            const historial = await res.json();
            const tlDiv = document.getElementById(`timeline-${idPedido}`);
            if (!tlDiv) return;
            tlDiv.innerHTML = historial.length === 0
                ? '<div style="font-size:0.85rem;color:var(--text-muted);">Sin historial disponible.</div>'
                : historial.map(entry => {
                    const fecha = new Date(entry.fechaCambio).toLocaleString();
                    return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.85rem;">
                        <span style="width:8px;height:8px;border-radius:50%;background:var(--primary-color);display:inline-block;"></span>
                        <span style="font-weight:600;">${entry.estadoNuevo}</span>
                        <span style="color:var(--text-muted);">- ${fecha}</span>
                    </div>`;
                }).join('');
        } catch (error) {
            console.error('Error al cargar timeline:', error);
        }
    }

    let chart1;
    let chart2;
    async function generarGraficos() {
        const ctxProd = document.getElementById('chartProductos').getContext('2d');
        if(chart1) chart1.destroy();
        chart1 = new Chart(ctxProd, {
            type: 'bar',
            data: {
                labels: productosCache.map(p => p.nombre.substring(0,10) + '...'),
                datasets: [{
                    label: 'Unidades en Stock',
                    data: productosCache.map(p => p.stock),
                    backgroundColor: '#00b4d8'
                }]
            }
        });

        try {
            const res = await apiFetch('/ventas?page=0&size=100');
            if (!res.ok) return;
            const data = await res.json();
            const ventas = data.content || [];

            const hoy = new Date();
            const dias = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(hoy);
                d.setDate(hoy.getDate() - i);
                dias.push(d);
            }

            const etiquetas = dias.map(d => d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }));
            const totalesPorDia = dias.map(d => {
                const clave = d.toDateString();
                return ventas
                    .filter(v => new Date(v.fecha).toDateString() === clave)
                    .reduce((sum, v) => sum + Number(v.total), 0);
            });

            const ctxDinero = document.getElementById('chartDinero').getContext('2d');
            if (chart2) chart2.destroy();
            chart2 = new Chart(ctxDinero, {
                type: 'line',
                data: {
                    labels: etiquetas,
                    datasets: [{
                        label: 'Ingresos (S/) - últimos 7 días',
                        data: totalesPorDia,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34,197,94,0.15)',
                        fill: true,
                        tension: 0.3
                    }]
                }
            });
        } catch (error) {
            console.error('Error al cargar gráfico de ingresos:', error);
        }
    }

    document.getElementById('add-categoria-btn')?.addEventListener('click', async () => {
        const nombre = document.getElementById('new-cat-name').value.trim();
        if (!nombre) {
            Swal.fire({ icon: 'warning', title: 'Ingresa un nombre para la categoría' });
            return;
        }
        try {
            const res = await apiFetch('/categorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre })
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Categoría creada', timer: 1500, showConfirmButton: false });
                document.getElementById('new-cat-name').value = '';
                cargarCategorias();
                cargarCategoriasParaSelect();
            } else {
                Swal.fire({ icon: 'error', title: 'Error al crear categoría' });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error de conexión' });
        }
    });

    const btnAddProduct = document.getElementById('add-product-btn');
    if (btnAddProduct) {
        btnAddProduct.addEventListener('click', async () => {
            const nombre = document.getElementById('new-name').value.trim();
            const idCategoria = parseInt(document.getElementById('new-category-select').value);
            const precioVenta = parseFloat(document.getElementById('new-price').value);
            const stock = parseInt(document.getElementById('new-stock').value);
            const imagenUrl = document.getElementById('new-image').value.trim();

            if (!nombre || isNaN(idCategoria) || isNaN(precioVenta) || isNaN(stock)) {
                Swal.fire({ icon: 'warning', title: 'Completa todos los campos requeridos' });
                return;
            }

            const nuevoProducto = {
                nombre: nombre,
                precioVenta: precioVenta,
                stock: stock,
                stockMinimo: 5,
                imagenUrl: imagenUrl || null,
                activo: true,
                categoria: { idCategoria: idCategoria }
            };

            try {
                const res = await apiFetch('/productos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevoProducto)
                });

                if (res.ok) {
                    Swal.fire({ icon: 'success', title: `Producto "${nombre}" creado`, timer: 1500, showConfirmButton: false });
                    document.getElementById('new-name').value = '';
                    document.getElementById('new-category-select').value = '';
                    document.getElementById('new-price').value = '';
                    document.getElementById('new-stock').value = '';
                    document.getElementById('new-image').value = '';
                    cargarProductos();
                } else {
                    Swal.fire({ icon: 'error', title: 'Error al guardar. Verifica que la categoría exista.' });
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error de conexión' });
            }
        });
    }

    cargarProductos();
    cargarCategoriasParaSelect();
});

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. BARRERA DE SEGURIDAD (Validar que sea ADMIN)
    const usuarioString = localStorage.getItem('flics_usuario');
    if (!usuarioString) {
        window.location.href = 'login.html'; // Si no hay usuario, lo bota
        return;
    }
    
    const usuarioActual = JSON.parse(usuarioString);
    if (usuarioActual.rol !== 'ADMIN') {
        alert("Acceso denegado. No tienes privilegios de Administrador.");
        window.location.href = 'login.html'; // Si no es admin, lo bota
        return;
    }

    // Mostrar el nombre/ID en la barra superior
    document.getElementById('admin-name-display').textContent = `Hola, ${usuarioActual.idUsuario}`;

    // Lógica para Cerrar Sesión
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('flics_usuario');
        window.location.href = 'login-personal.html';
    });

    // --- CONEXIÓN CON JAVA ---
    const API_URL = window.BACKEND_API_URL || 'http://localhost:8080/api';
    let productosCache = [];

    // 2. NAVEGACIÓN DE PESTAÑAS
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const currentTabId = btn.dataset.tab;
            document.getElementById(currentTabId).classList.add('active');
            
            // Cargar datos dinámicamente según la pestaña
            if (currentTabId === 'tab-productos') cargarProductos();
            if (currentTabId === 'tab-pedidos') cargarPedidos();
            if (currentTabId === 'tab-graficos') generarGraficos();
        });
    });

    // 3. CARGAR PRODUCTOS DESDE MYSQL
    async function cargarProductos() {
        const container = document.getElementById('admin-products-container');
        container.innerHTML = '<p>Cargando inventario...</p>';
        
        try {
            const res = await fetch(`${API_URL}/productos`);
            if (res.ok) {
                productosCache = await res.json();
                container.innerHTML = '';
                
                productosCache.forEach(product => {
                    const itemHtml = `
                        <div class="admin-item" style="display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid #eee;">
                            <div>
                                <div style="font-weight: bold;">${product.nombre}</div>
                                <div style="font-size: 0.85rem; color: #666;">
                                    Cat: ${product.categoria ? product.categoria.nombre : 'N/A'} | Código: ${product.codigoBarras || 'N/A'}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: var(--primary-color); font-weight: bold;">S/ ${product.precioVenta.toFixed(2)}</div>
                                <div style="font-size: 0.85rem; color: ${product.stock <= product.stockMinimo ? 'red' : 'green'}; font-weight: bold;">
                                    Stock: ${product.stock}
                                </div>
                            </div>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', itemHtml);
                });
            }
        } catch (error) {
            container.innerHTML = '<p style="color:red;">Error al cargar datos desde Spring Boot.</p>';
        }
    }

    // 4. CARGAR PEDIDOS DESDE MYSQL
    async function cargarPedidos() {
        const container = document.getElementById('admin-orders-container');
        container.innerHTML = '<p>Cargando historial...</p>';
        
        try {
            const res = await fetch(`${API_URL}/pedidos`); // Ojo: Aquí podrías querer agregar un endpoint para /ventas también
            if (res.ok) {
                const pedidosBd = await res.json();
                container.innerHTML = pedidosBd.map(order => `
                    <div class="admin-item" style="padding: 15px; border-bottom: 1px solid #eee;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
                            <span>Orden #WEB-${order.idPedido}</span>
                            <span style="color: var(--primary-color);">${order.estado}</span>
                        </div>
                        <div style="font-size: 0.9rem; color: #666;">Fecha: ${new Date(order.fecha).toLocaleString()}</div>
                        <div style="font-weight: 700; margin-top: 5px;">Total Pagado: S/ ${Number(order.total).toFixed(2)}</div>
                    </div>
                `).join('') || '<p>No hay pedidos registrados en la base de datos.</p>';
            }
        } catch (error) {
            container.innerHTML = '<p style="color:red;">Error al cargar pedidos.</p>';
        }
    }

    // 5. GRÁFICOS DINÁMICOS
    let chart1, chart2;
    function generarGraficos() {
        // Gráfico 1: Inventario Total por Producto
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
    }
    // 6. CREAR UN NUEVO PRODUCTO (POST a Spring Boot)
    const btnAddProduct = document.getElementById('add-product-btn');
    
    if (btnAddProduct) {
        btnAddProduct.addEventListener('click', async () => {
            // 1. Capturamos los valores de los inputs del HTML
            const nombre = document.getElementById('new-name').value.trim();
            const idCategoria = parseInt(document.getElementById('new-category-select').value);
            const precioVenta = parseFloat(document.getElementById('new-price').value);
            const stock = parseInt(document.getElementById('new-stock').value);

            // 2. Validaciones básicas
            if (!nombre || isNaN(idCategoria) || isNaN(precioVenta) || isNaN(stock)) {
                alert("Por favor, completa todos los campos correctamente.");
                return;
            }

            // 3. Armamos el JSON con la estructura que espera tu Producto de Java
            const nuevoProducto = {
                nombre: nombre,
                precioVenta: precioVenta,
                stock: stock,
                stockMinimo: 5, // Valor por defecto para las alertas
                estado: "Activo",
                categoria: { 
                    idCategoria: idCategoria // Anidamos el ID para la relación en MySQL
                }
            };

            try {
                // 4. Enviamos la petición POST al backend
                const res = await fetch(`${API_URL}/productos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(nuevoProducto)
                });

                if (res.ok) {
                    alert(`¡Producto "${nombre}" guardado con éxito en la Base de Datos!`);
                    
                    // Limpiamos los campos
                    document.getElementById('new-name').value = '';
                    document.getElementById('new-category-select').value = '';
                    document.getElementById('new-price').value = '';
                    document.getElementById('new-stock').value = '';

                    // Recargamos la tabla de productos para ver el nuevo item
                    cargarProductos();
                } else {
                    alert("Error al guardar el producto. Verifica que el ID de categoría exista en la base de datos.");
                }
            } catch (error) {
                console.error("Error en la petición POST:", error);
                alert("Hubo un problema de conexión con el servidor Java.");
            }
        });
    }

    // Iniciar cargando la pestaña por defecto
    cargarProductos();
});
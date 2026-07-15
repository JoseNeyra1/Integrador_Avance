document.addEventListener('DOMContentLoaded', () => {
    const clienteString = localStorage.getItem('flics_cliente_web');
    if (!clienteString) {
        window.location.href = 'login-cliente.html';
        return;
    }

    const cliente = JSON.parse(clienteString);
    document.getElementById('user-name-display').textContent = `Hola, ${cliente.nombre.split(' ')[0]}`;

    document.getElementById('btn-logout-cliente').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('flics_cliente_web');
        window.location.href = 'index.html';
    });

    const container = document.getElementById('orders-container');

    async function cargarPedidos() {
        container.innerHTML = '<p style="text-align:center;padding:40px;">Cargando tus pedidos...</p>';

        try {
            const res = await apiFetch(`/pedidos/cliente/${cliente.idPersona}`);
            if (!res.ok) throw new Error('Error al cargar pedidos');

            const pedidos = await res.json();

            if (pedidos.length === 0) {
                container.innerHTML = `
                    <div class="no-orders">
                        <i class="fas fa-shopping-bag"></i>
                        <h3>Aún no tienes pedidos</h3>
                        <p>Visita nuestra tienda y realiza tu primera compra.</p>
                        <a href="index.html" class="btn-primary" style="display:inline-block;margin-top:15px;">Ir a Tienda</a>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            pedidos.forEach(pedido => {
                const card = document.createElement('div');
                card.classList.add('order-card');

                const fecha = new Date(pedido.fecha).toLocaleDateString('es-PE', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                const deliveryInfo = pedido.delivery
                    ? `<span class="delivery-badge"><i class="fas fa-truck"></i> Delivery (+S/ ${Number(pedido.costoDelivery).toFixed(2)})</span>`
                    : '';

                card.innerHTML = `
                    <div class="order-card-header" onclick="toggleOrder(this)">
                        <div>
                            <span class="order-id">#FL-${pedido.idPedido}</span>
                            ${deliveryInfo}
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span class="order-status status-${pedido.estado}">${pedido.estado}</span>
                            <i class="fas fa-chevron-down" style="color:var(--text-muted);transition:transform 0.3s;"></i>
                        </div>
                    </div>
                    <div class="order-card-body" style="display:none;">
                        <div class="order-summary">
                            <span>Fecha</span>
                            <span>${fecha}</span>
                        </div>
                        <div class="order-summary">
                            <span>Total</span>
                            <span style="color:var(--primary-color);font-size:1.1rem;">S/ ${Number(pedido.total).toFixed(2)}</span>
                        </div>
                        ${pedido.comprobanteYape ? `
                        <div class="order-summary">
                            <span>Comprobante Yape</span>
                            <span>${pedido.comprobanteYape}</span>
                        </div>` : ''}
                        <div class="timeline-section">
                            <h4><i class="fas fa-clock"></i> Línea de Tiempo</h4>
                            <div class="timeline" id="timeline-${pedido.idPedido}">
                                <p style="font-size:0.85rem;color:var(--text-muted);">Cargando...</p>
                            </div>
                        </div>
                    </div>
                `;

                container.appendChild(card);

                cargarTimeline(pedido.idPedido);
            });
        } catch (error) {
            console.error('Error:', error);
            container.innerHTML = '<p style="text-align:center;padding:40px;color:red;">Error al cargar tus pedidos. Intenta de nuevo.</p>';
        }
    }

    async function cargarTimeline(idPedido) {
        try {
            const res = await apiFetch(`/pedidos/${idPedido}/historial`);
            if (!res.ok) return;

            const historial = await res.json();
            const timelineContainer = document.getElementById(`timeline-${idPedido}`);
            if (!timelineContainer) return;

            if (historial.length === 0) {
                timelineContainer.innerHTML = '<p style="font-size:0.85rem;color:var(--text-muted);">Sin historial disponible.</p>';
                return;
            }

            timelineContainer.innerHTML = '';
            historial.forEach(entry => {
                const fecha = new Date(entry.fechaCambio).toLocaleString('es-PE', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                const item = document.createElement('div');
                item.classList.add('timeline-item');
                item.innerHTML = `
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="tl-status">${entry.estadoNuevo}</div>
                        <div class="tl-date">${fecha}</div>
                    </div>
                `;
                timelineContainer.appendChild(item);
            });
        } catch (error) {
            console.error('Error al cargar timeline:', error);
        }
    }

    window.toggleOrder = function(header) {
        const body = header.nextElementSibling;
        const icon = header.querySelector('.fa-chevron-down');
        if (body.style.display === 'none') {
            body.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
        } else {
            body.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
        }
    };

    cargarPedidos();
});

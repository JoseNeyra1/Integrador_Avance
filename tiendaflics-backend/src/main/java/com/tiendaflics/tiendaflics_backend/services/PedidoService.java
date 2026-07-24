package com.tiendaflics.tiendaflics_backend.services;

import com.tiendaflics.tiendaflics_backend.entities.DetallePedido;
import com.tiendaflics.tiendaflics_backend.entities.HistorialEstado;
import com.tiendaflics.tiendaflics_backend.entities.Pedido;
import com.tiendaflics.tiendaflics_backend.entities.Producto;
import com.tiendaflics.tiendaflics_backend.exceptions.RecursoNoEncontradoException;
import com.tiendaflics.tiendaflics_backend.exceptions.ReglaDeNegocioException;
import com.tiendaflics.tiendaflics_backend.repositories.DetallePedidoRepository;
import com.tiendaflics.tiendaflics_backend.repositories.HistorialEstadoRepository;
import com.tiendaflics.tiendaflics_backend.repositories.PedidoRepository;
import com.tiendaflics.tiendaflics_backend.repositories.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private HistorialEstadoRepository historialEstadoRepository;

    // Transiciones de estado permitidas: solo se puede avanzar en el flujo o cancelar; nada desde un estado terminal.
    private static final Map<Pedido.EstadoPedido, Set<Pedido.EstadoPedido>> TRANSICIONES_VALIDAS = new EnumMap<>(Pedido.EstadoPedido.class);

    static {
        TRANSICIONES_VALIDAS.put(Pedido.EstadoPedido.Pendiente, EnumSet.of(Pedido.EstadoPedido.Preparacion, Pedido.EstadoPedido.Cancelado));
        TRANSICIONES_VALIDAS.put(Pedido.EstadoPedido.Preparacion, EnumSet.of(Pedido.EstadoPedido.Listo, Pedido.EstadoPedido.Cancelado));
        TRANSICIONES_VALIDAS.put(Pedido.EstadoPedido.Listo, EnumSet.of(Pedido.EstadoPedido.Entregado, Pedido.EstadoPedido.Cancelado));
        TRANSICIONES_VALIDAS.put(Pedido.EstadoPedido.Entregado, EnumSet.noneOf(Pedido.EstadoPedido.class));
        TRANSICIONES_VALIDAS.put(Pedido.EstadoPedido.Cancelado, EnumSet.noneOf(Pedido.EstadoPedido.class));
    }

    public List<Pedido> obtenerTodos() {
        return pedidoRepository.findAll();
    }

    public Page<Pedido> obtenerTodos(Pageable pageable) {
        return pedidoRepository.findAll(pageable);
    }

    public List<Pedido> obtenerPedidosPorCliente(Integer idCliente) {
        return pedidoRepository.findByClienteIdPersonaOrderByFechaDesc(idCliente);
    }

    public Pedido obtenerPorId(Integer idPedido) {
        return pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pedido no encontrado"));
    }

    public List<HistorialEstado> obtenerHistorialEstado(Integer idPedido) {
        return historialEstadoRepository.findByPedidoIdPedidoOrderByFechaCambioAsc(idPedido);
    }

    public List<DetallePedido> obtenerDetallesPorPedido(Integer idPedido) {
        return detallePedidoRepository.findByPedidoIdPedido(idPedido);
    }

    @Transactional
    public Pedido procesarNuevoPedido(Pedido pedido, List<DetallePedido> detalles) {

        if (pedido.getDelivery() != null && pedido.getDelivery()) {
            BigDecimal totalConDelivery = pedido.getTotal().add(pedido.getCostoDelivery());
            pedido.setTotal(totalConDelivery);
        }

        // 1. Validar stock de todos los productos ANTES de persistir nada (fail-fast)
        for (DetallePedido detalle : detalles) {
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado en inventario"));

            if (producto.getStock() < detalle.getCantidad()) {
                throw new ReglaDeNegocioException("Stock insuficiente para el producto: " + producto.getNombre());
            }
        }

        // 2. Ya validado todo el pedido, se guarda y se descuenta el stock
        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        for (DetallePedido detalle : detalles) {
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado en inventario"));

            BigDecimal subtotal = detalle.getPrecioCompra().multiply(BigDecimal.valueOf(detalle.getCantidad()));
            detalle.setSubtotal(subtotal);
            detalle.setPedido(pedidoGuardado);
            // Reemplazar el "stub" (solo id, sin versión) que llegó del cliente por la entidad
            // real ya gestionada por JPA; si no, Hibernate no puede resolver el lock optimista.
            detalle.setProducto(producto);
            detallePedidoRepository.save(detalle);

            producto.setStock(producto.getStock() - detalle.getCantidad());
            productoRepository.save(producto);
        }

        historialEstadoRepository.save(
                new HistorialEstado(pedidoGuardado, null, pedidoGuardado.getEstado().name())
        );

        return pedidoGuardado;
    }

    @Transactional
    public Pedido actualizarEstadoPedido(Integer idPedido, String nuevoEstadoStr) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pedido no encontrado"));

        Pedido.EstadoPedido estadoActual = pedido.getEstado();
        Pedido.EstadoPedido nuevoEstado;
        try {
            nuevoEstado = Pedido.EstadoPedido.valueOf(nuevoEstadoStr);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ReglaDeNegocioException("Estado no reconocido: " + nuevoEstadoStr);
        }

        Set<Pedido.EstadoPedido> permitidos = TRANSICIONES_VALIDAS.getOrDefault(estadoActual, EnumSet.noneOf(Pedido.EstadoPedido.class));
        if (!permitidos.contains(nuevoEstado)) {
            throw new ReglaDeNegocioException("No se puede pasar de '" + estadoActual + "' a '" + nuevoEstado + "'");
        }

        pedido.setEstado(nuevoEstado);
        Pedido pedidoActualizado = pedidoRepository.save(pedido);

        historialEstadoRepository.save(
                new HistorialEstado(pedidoActualizado, estadoActual.name(), nuevoEstado.name())
        );

        return pedidoActualizado;
    }
}

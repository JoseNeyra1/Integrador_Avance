package com.tiendaflics.tiendaflics_backend.services;

import com.tiendaflics.tiendaflics_backend.entities.DetallePedido;
import com.tiendaflics.tiendaflics_backend.entities.HistorialEstado;
import com.tiendaflics.tiendaflics_backend.entities.Pedido;
import com.tiendaflics.tiendaflics_backend.entities.Producto;
import com.tiendaflics.tiendaflics_backend.exceptions.ReglaDeNegocioException;
import com.tiendaflics.tiendaflics_backend.repositories.DetallePedidoRepository;
import com.tiendaflics.tiendaflics_backend.repositories.HistorialEstadoRepository;
import com.tiendaflics.tiendaflics_backend.repositories.PedidoRepository;
import com.tiendaflics.tiendaflics_backend.repositories.ProductoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PedidoServiceTest {

    @Mock private PedidoRepository pedidoRepository;
    @Mock private DetallePedidoRepository detallePedidoRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private HistorialEstadoRepository historialEstadoRepository;

    @InjectMocks
    private PedidoService pedidoService;

    private Producto producto;

    @BeforeEach
    void setUp() {
        producto = new Producto();
        producto.setIdProducto(1);
        producto.setNombre("Gaseosa");
        producto.setStock(2);
        producto.setPrecioVenta(new BigDecimal("5.00"));
    }

    @Test
    void noDebeGuardarNadaSiElStockEsInsuficiente() {
        DetallePedido detalle = new DetallePedido();
        detalle.setProducto(producto);
        detalle.setCantidad(5); // supera el stock disponible (2)
        detalle.setPrecioCompra(new BigDecimal("5.00"));

        Pedido pedido = new Pedido();
        pedido.setTotal(new BigDecimal("25.00"));
        pedido.setDelivery(false);

        when(productoRepository.findById(1)).thenReturn(Optional.of(producto));

        assertThrows(ReglaDeNegocioException.class, () ->
                pedidoService.procesarNuevoPedido(pedido, List.of(detalle))
        );

        // La validación debe ocurrir ANTES de guardar nada (fail-fast)
        verify(pedidoRepository, never()).save(any());
        verify(detallePedidoRepository, never()).save(any());
    }

    @Test
    void debeRegistrarHistorialAlCrearPedido() {
        DetallePedido detalle = new DetallePedido();
        detalle.setProducto(producto);
        detalle.setCantidad(1);
        detalle.setPrecioCompra(new BigDecimal("5.00"));

        Pedido pedido = new Pedido();
        pedido.setIdPedido(10);
        pedido.setTotal(new BigDecimal("5.00"));
        pedido.setDelivery(false);
        pedido.setEstado(Pedido.EstadoPedido.Pendiente);

        when(productoRepository.findById(1)).thenReturn(Optional.of(producto));
        when(pedidoRepository.save(any(Pedido.class))).thenReturn(pedido);

        pedidoService.procesarNuevoPedido(pedido, List.of(detalle));

        verify(historialEstadoRepository).save(argThat((HistorialEstado h) ->
                h.getEstadoAnterior() == null && "Pendiente".equals(h.getEstadoNuevo())
        ));
    }

    @Test
    void noDebePermitirRetrocederDeEntregadoAPendiente() {
        Pedido pedido = new Pedido();
        pedido.setIdPedido(1);
        pedido.setEstado(Pedido.EstadoPedido.Entregado);

        when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido));

        assertThrows(ReglaDeNegocioException.class, () ->
                pedidoService.actualizarEstadoPedido(1, "Pendiente")
        );

        verify(pedidoRepository, never()).save(any());
    }

    @Test
    void debePermitirAvanzarDePendienteAPreparacion() {
        Pedido pedido = new Pedido();
        pedido.setIdPedido(1);
        pedido.setEstado(Pedido.EstadoPedido.Pendiente);

        when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        Pedido actualizado = pedidoService.actualizarEstadoPedido(1, "Preparacion");

        assertThat(actualizado.getEstado()).isEqualTo(Pedido.EstadoPedido.Preparacion);
        verify(historialEstadoRepository).save(any(HistorialEstado.class));
    }
}

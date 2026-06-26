package com.tiendaflics.tiendaflics_backend.services;

import com.tiendaflics.tiendaflics_backend.entities.DetallePedido;
import com.tiendaflics.tiendaflics_backend.entities.Pedido;
import com.tiendaflics.tiendaflics_backend.entities.Producto;
import com.tiendaflics.tiendaflics_backend.repositories.DetallePedidoRepository;
import com.tiendaflics.tiendaflics_backend.repositories.PedidoRepository;
import com.tiendaflics.tiendaflics_backend.repositories.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    // Obtener todos los pedidos (Para el Dashboard del Administrador)
    public List<Pedido> obtenerTodos() {
        return pedidoRepository.findAll();
    }

    // @Transactional asegura que si falla el descuento de stock, el pedido se cancela automáticamente
    @Transactional
    public Pedido procesarNuevoPedido(Pedido pedido, List<DetallePedido> detalles) {

        // 1. Guardar el pedido principal en la base de datos
        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        // 2. Recorrer los detalles del carrito de compras
        for (DetallePedido detalle : detalles) {
            // Enlazamos el detalle con el pedido recién creado
            detalle.setPedido(pedidoGuardado);
            detallePedidoRepository.save(detalle);

            // 3. Restar el stock del inventario
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado en inventario"));

            // Validar que haya stock suficiente
            if (producto.getStock() < detalle.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre());
            }

            producto.setStock(producto.getStock() - detalle.getCantidad());
            productoRepository.save(producto);
        }

        return pedidoGuardado;
    }
}
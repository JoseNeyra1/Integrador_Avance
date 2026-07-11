package com.tiendaflics.tiendaflics_backend.services;

import com.tiendaflics.tiendaflics_backend.entities.DetalleVenta;
import com.tiendaflics.tiendaflics_backend.entities.Producto;
import com.tiendaflics.tiendaflics_backend.entities.Venta;
import com.tiendaflics.tiendaflics_backend.repositories.DetalleVentaRepository;
import com.tiendaflics.tiendaflics_backend.repositories.ProductoRepository;
import com.tiendaflics.tiendaflics_backend.repositories.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VentaService {

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private DetalleVentaRepository detalleVentaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    // Obtener historial de ventas (Ideal para los reportes de caja)
    public List<Venta> obtenerTodas() {
        return ventaRepository.findAll();
    }

    // Registrar una venta física y actualizar el inventario
    @Transactional
    public Venta procesarNuevaVenta(Venta venta, List<DetalleVenta> detalles) {

        // 1. Guardar el comprobante principal de la venta
        Venta ventaGuardada = ventaRepository.save(venta);

        // 2. Procesar cada producto escaneado por el cajero
        for (DetalleVenta detalle : detalles) {
            // Enlazar el detalle con la venta
            detalle.setVenta(ventaGuardada);
            detalleVentaRepository.save(detalle);

            // 3. Buscar el producto y restar el stock
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                    .orElseThrow(() -> new RuntimeException("El producto escaneado no existe en la base de datos"));

            // Validar inventario en tiempo real
            if (producto.getStock() < detalle.getCantidad()) {
                throw new RuntimeException("Stock insuficiente en tienda para: " + producto.getNombre());
            }

            producto.setStock(producto.getStock() - detalle.getCantidad());
            productoRepository.save(producto);
        }

        return ventaGuardada;
    }
}
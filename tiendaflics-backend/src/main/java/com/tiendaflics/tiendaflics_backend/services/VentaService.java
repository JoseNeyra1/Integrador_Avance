package com.tiendaflics.tiendaflics_backend.services;

import com.tiendaflics.tiendaflics_backend.entities.DetalleVenta;
import com.tiendaflics.tiendaflics_backend.entities.Producto;
import com.tiendaflics.tiendaflics_backend.entities.Venta;
import com.tiendaflics.tiendaflics_backend.exceptions.RecursoNoEncontradoException;
import com.tiendaflics.tiendaflics_backend.exceptions.ReglaDeNegocioException;
import com.tiendaflics.tiendaflics_backend.repositories.DetalleVentaRepository;
import com.tiendaflics.tiendaflics_backend.repositories.ProductoRepository;
import com.tiendaflics.tiendaflics_backend.repositories.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    public Page<Venta> obtenerTodas(Pageable pageable) {
        return ventaRepository.findAll(pageable);
    }

    // Registrar una venta física y actualizar el inventario
    @Transactional
    public Venta procesarNuevaVenta(Venta venta, List<DetalleVenta> detalles) {

        // 1. Validar stock de todos los productos ANTES de persistir nada (fail-fast)
        for (DetalleVenta detalle : detalles) {
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                    .orElseThrow(() -> new RecursoNoEncontradoException("El producto escaneado no existe en la base de datos"));

            if (producto.getStock() < detalle.getCantidad()) {
                throw new ReglaDeNegocioException("Stock insuficiente en tienda para: " + producto.getNombre());
            }
        }

        // 2. Guardar el comprobante principal de la venta
        Venta ventaGuardada = ventaRepository.save(venta);

        // 3. Procesar cada producto escaneado por el cajero
        for (DetalleVenta detalle : detalles) {
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                    .orElseThrow(() -> new RecursoNoEncontradoException("El producto escaneado no existe en la base de datos"));

            // Reemplazar el "stub" (solo id, sin versión) que llegó del cliente por la entidad
            // real ya gestionada por JPA; si no, Hibernate no puede resolver el lock optimista.
            detalle.setVenta(ventaGuardada);
            detalle.setProducto(producto);
            detalleVentaRepository.save(detalle);

            producto.setStock(producto.getStock() - detalle.getCantidad());
            productoRepository.save(producto);
        }

        return ventaGuardada;
    }
}

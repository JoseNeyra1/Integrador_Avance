package com.tiendaflics.tiendaflics_backend.controllers;

import com.tiendaflics.tiendaflics_backend.entities.DetalleVenta;
import com.tiendaflics.tiendaflics_backend.entities.Venta;
import com.tiendaflics.tiendaflics_backend.services.VentaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ventas")
@CrossOrigin(origins = "*") // Fundamental para que la app de escritorio y web se conecten
public class VentaController {

    @Autowired
    private VentaService ventaService;

    // Listar todas las ventas presenciales (paginado)
    @GetMapping
    public Page<Venta> listarVentas(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "fecha"));
        return ventaService.obtenerTodas(pageable);
    }

    // Procesar una venta desde la caja
    @PostMapping
    public Venta registrarVenta(@Valid @RequestBody VentaRequest ventaRequest) {
        return ventaService.procesarNuevaVenta(ventaRequest.getVenta(), ventaRequest.getDetalles());
    }

    // Clase auxiliar para agrupar la cabecera y el detalle en el JSON
    public static class VentaRequest {
        @Valid
        private Venta venta;
        @Valid
        private List<DetalleVenta> detalles;

        public Venta getVenta() { return venta; }
        public void setVenta(Venta venta) { this.venta = venta; }
        public List<DetalleVenta> getDetalles() { return detalles; }
        public void setDetalles(List<DetalleVenta> detalles) { this.detalles = detalles; }
    }
}

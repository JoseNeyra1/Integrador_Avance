package com.tiendaflics.tiendaflics_backend.controllers;

import com.tiendaflics.tiendaflics_backend.entities.DetalleVenta;
import com.tiendaflics.tiendaflics_backend.entities.Venta;
import com.tiendaflics.tiendaflics_backend.services.VentaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ventas")
@CrossOrigin(origins = "*") // Fundamental para que la app de escritorio y web se conecten
public class VentaController {

    @Autowired
    private VentaService ventaService;

    // Listar todas las ventas presenciales
    @GetMapping
    public List<Venta> listarVentas() {
        return ventaService.obtenerTodas();
    }

    // Procesar una venta desde la caja
    @PostMapping
    public Venta registrarVenta(@RequestBody VentaRequest ventaRequest) {
        return ventaService.procesarNuevaVenta(ventaRequest.getVenta(), ventaRequest.getDetalles());
    }

    // Clase auxiliar para agrupar la cabecera y el detalle en el JSON
    public static class VentaRequest {
        private Venta venta;
        private List<DetalleVenta> detalles;

        public Venta getVenta() { return venta; }
        public void setVenta(Venta venta) { this.venta = venta; }
        public List<DetalleVenta> getDetalles() { return detalles; }
        public void setDetalles(List<DetalleVenta> detalles) { this.detalles = detalles; }
    }
}
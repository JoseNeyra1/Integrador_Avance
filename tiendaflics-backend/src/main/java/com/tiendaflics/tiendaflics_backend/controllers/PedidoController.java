package com.tiendaflics.tiendaflics_backend.controllers;

import com.tiendaflics.tiendaflics_backend.entities.DetallePedido;
import com.tiendaflics.tiendaflics_backend.entities.HistorialEstado;
import com.tiendaflics.tiendaflics_backend.entities.Pedido;
import com.tiendaflics.tiendaflics_backend.security.AuthPrincipal;
import com.tiendaflics.tiendaflics_backend.services.PedidoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(origins = "*")
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    @GetMapping
    public Page<Pedido> listarPedidos(@RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "fecha"));
        return pedidoService.obtenerTodos(pageable);
    }

    @GetMapping("/cliente/{idCliente}")
    public ResponseEntity<?> listarPedidosPorCliente(@PathVariable Integer idCliente, Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        if ("CLIENTE".equals(principal.rol()) && !idCliente.equals(principal.idPersona())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No puedes ver pedidos de otro cliente"));
        }
        return ResponseEntity.ok(pedidoService.obtenerPedidosPorCliente(idCliente));
    }

    @GetMapping("/{id}/historial")
    public ResponseEntity<?> obtenerHistorial(@PathVariable Integer id, Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        if ("CLIENTE".equals(principal.rol())) {
            Pedido pedido = pedidoService.obtenerPorId(id);
            if (pedido.getCliente() == null || !pedido.getCliente().getIdPersona().equals(principal.idPersona())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No puedes ver el historial de otro cliente"));
            }
        }
        List<HistorialEstado> historial = pedidoService.obtenerHistorialEstado(id);
        return ResponseEntity.ok(historial);
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        Pedido actualizado = pedidoService.actualizarEstadoPedido(id, body.get("estado"));
        return ResponseEntity.ok(actualizado);
    }

    @PostMapping
    public ResponseEntity<?> crearPedido(@Valid @RequestBody PedidoRequest pedidoRequest, Authentication authentication) {
        if (pedidoRequest.getPedido() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Datos de pedido inválidos"));
        }
        if (pedidoRequest.getDetalles() == null || pedidoRequest.getDetalles().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El pedido debe tener al menos un producto"));
        }

        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        if ("CLIENTE".equals(principal.rol())) {
            Integer idClienteSolicitado = pedidoRequest.getPedido().getCliente() != null
                    ? pedidoRequest.getPedido().getCliente().getIdPersona() : null;
            if (idClienteSolicitado == null || !idClienteSolicitado.equals(principal.idPersona())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No puedes crear pedidos a nombre de otro cliente"));
            }
        }

        Pedido creado = pedidoService.procesarNuevoPedido(pedidoRequest.getPedido(), pedidoRequest.getDetalles());
        return ResponseEntity.ok(creado);
    }

    public static class PedidoRequest {
        @jakarta.validation.Valid
        private Pedido pedido;
        @jakarta.validation.Valid
        private List<DetallePedido> detalles;

        public Pedido getPedido() { return pedido; }
        public void setPedido(Pedido pedido) { this.pedido = pedido; }
        public List<DetallePedido> getDetalles() { return detalles; }
        public void setDetalles(List<DetallePedido> detalles) { this.detalles = detalles; }
    }
}

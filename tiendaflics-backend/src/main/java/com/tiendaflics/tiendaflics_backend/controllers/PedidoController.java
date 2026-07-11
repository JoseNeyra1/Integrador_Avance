package com.tiendaflics.tiendaflics_backend.controllers;

import com.tiendaflics.tiendaflics_backend.entities.DetallePedido;
import com.tiendaflics.tiendaflics_backend.entities.Pedido;
import com.tiendaflics.tiendaflics_backend.services.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    // Obtener la lista de pedidos para el administrador
    @GetMapping
    public List<Pedido> listarPedidos() {
        return pedidoService.obtenerTodos();
    }

    // Recibir un nuevo pedido desde el carrito de compras del cliente
    @PostMapping
    public Pedido crearPedido(@RequestBody PedidoRequest pedidoRequest) {
        return pedidoService.procesarNuevoPedido(pedidoRequest.getPedido(), pedidoRequest.getDetalles());
    }

    // Clase auxiliar para recibir el JSON agrupado del frontend
    public static class PedidoRequest {
        private Pedido pedido;
        private List<DetallePedido> detalles;

        public Pedido getPedido() { return pedido; }
        public void setPedido(Pedido pedido) { this.pedido = pedido; }
        public List<DetallePedido> getDetalles() { return detalles; }
        public void setDetalles(List<DetallePedido> detalles) { this.detalles = detalles; }
    }
}
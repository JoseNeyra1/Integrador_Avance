package com.tiendaflics.tiendaflics_backend.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Pedido")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido")
    private Integer idPedido;

    private LocalDateTime fecha = LocalDateTime.now();

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    private EstadoPedido estado = EstadoPedido.Pendiente;

    @Column(name = "comprobante_yape")
    private String comprobanteYape;

    @ManyToOne
    @JoinColumn(name = "id_cliente")
    private Cliente cliente;

    public enum EstadoPedido {
        Pendiente, Preparacion, Listo, Entregado, Cancelado
    }

    public Pedido() {}

    // Agrega aquí los Getters y Setters necesarios
}
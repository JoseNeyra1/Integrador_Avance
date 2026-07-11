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

    public Integer getIdPedido() {
        return idPedido;
    }

    public void setIdPedido(Integer idPedido) {
        this.idPedido = idPedido;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public EstadoPedido getEstado() {
        return estado;
    }

    public void setEstado(EstadoPedido estado) {
        this.estado = estado;
    }

    public String getComprobanteYape() {
        return comprobanteYape;
    }

    public void setComprobanteYape(String comprobanteYape) {
        this.comprobanteYape = comprobanteYape;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }
}
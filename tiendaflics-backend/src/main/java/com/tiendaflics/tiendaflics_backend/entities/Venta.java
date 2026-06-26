package com.tiendaflics.tiendaflics_backend.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Venta")
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_venta")
    private Integer idVenta;

    private LocalDateTime fecha = LocalDateTime.now();

    @Column(precision = 10, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    // Quién atendió la venta (Obligatorio)
    @ManyToOne
    @JoinColumn(name = "id_vendedor", nullable = false)
    private UsuarioPersonal vendedor;

    // A quién se le vendió (Puede ser nulo si es un cliente de paso)
    @ManyToOne
    @JoinColumn(name = "id_cliente")
    private Cliente cliente;

    // Con qué pagó
    @ManyToOne
    @JoinColumn(name = "id_metodo", nullable = false)
    private MetodoPago metodoPago;

    public Venta() {}

    // Getters y Setters
    public Integer getIdVenta() { return idVenta; }
    public void setIdVenta(Integer idVenta) { this.idVenta = idVenta; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public UsuarioPersonal getVendedor() { return vendedor; }
    public void setVendedor(UsuarioPersonal vendedor) { this.vendedor = vendedor; }

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }

    public MetodoPago getMetodoPago() { return metodoPago; }
    public void setMetodoPago(MetodoPago metodoPago) { this.metodoPago = metodoPago; }
}
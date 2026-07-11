package com.tiendaflics.tiendaflics_backend.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "Metodo_Pago")
public class MetodoPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_metodo")
    private Integer idMetodo;

    @Column(nullable = false, length = 50)
    private String nombre;

    public MetodoPago() {}

    // Getters y Setters
    public Integer getIdMetodo() { return idMetodo; }
    public void setIdMetodo(Integer idMetodo) { this.idMetodo = idMetodo; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
}
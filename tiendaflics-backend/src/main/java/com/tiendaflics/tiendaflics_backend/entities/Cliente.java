package com.tiendaflics.tiendaflics_backend.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "Cliente")
@PrimaryKeyJoinColumn(name = "id_persona")
public class Cliente extends Persona {

    @Column(name = "puntos_lealtad")
    private Integer puntosLealtad = 0;

    public Cliente() {}

    public Integer getPuntosLealtad() { return puntosLealtad; }
    public void setPuntosLealtad(Integer puntosLealtad) { this.puntosLealtad = puntosLealtad; }
}
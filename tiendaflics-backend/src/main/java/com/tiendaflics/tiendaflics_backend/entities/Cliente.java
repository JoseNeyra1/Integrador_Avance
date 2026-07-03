package com.tiendaflics.tiendaflics_backend.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

@Entity
@Table(name = "Cliente")
public class Cliente {

    @Id
    @Column(name = "id_persona")
    private Integer idPersona;

    @Column(name = "puntos_lealtad")
    private Integer puntosLealtad;

    @Column(name = "password")
    private String password;

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Integer getIdPersona() { return idPersona; }
    public void setIdPersona(Integer idPersona) { this.idPersona = idPersona; }

    public Integer getPuntosLealtad() { return puntosLealtad; }
    public void setPuntosLealtad(Integer puntosLealtad) { this.puntosLealtad = puntosLealtad; }
}
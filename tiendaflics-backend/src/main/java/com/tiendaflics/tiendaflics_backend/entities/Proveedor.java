package com.tiendaflics.tiendaflics_backend.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "Proveedor")
@PrimaryKeyJoinColumn(name = "id_persona")
public class Proveedor extends Persona {

    @Column(name = "ruc_dni", unique = true, nullable = false, length = 20)
    private String rucDni;

    @Column(nullable = false, length = 100)
    private String empresa;

    @Column(length = 100)
    private String rubro;

    public Proveedor() {}

    // Getters y Setters
    public String getRucDni() { return rucDni; }
    public void setRucDni(String rucDni) { this.rucDni = rucDni; }

    public String getEmpresa() { return empresa; }
    public void setEmpresa(String empresa) { this.empresa = empresa; }

    public String getRubro() { return rubro; }
    public void setRubro(String rubro) { this.rubro = rubro; }
}
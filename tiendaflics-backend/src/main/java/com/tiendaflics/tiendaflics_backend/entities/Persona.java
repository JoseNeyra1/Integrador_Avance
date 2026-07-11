package com.tiendaflics.tiendaflics_backend.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "Persona")
@Inheritance(strategy = InheritanceType.JOINED)
public class Persona {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_persona")
    private Integer idPersona;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(unique = true, length = 20)
    private String documento;

    @Column(length = 15)
    private String telefono;

    @Column(length = 150)
    private String direccion;

    @Column(length = 100)
    private String email;

    public Persona() {}

    // Getters y Setters
    public Integer getIdPersona() { return idPersona; }
    public void setIdPersona(Integer idPersona) { this.idPersona = idPersona; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
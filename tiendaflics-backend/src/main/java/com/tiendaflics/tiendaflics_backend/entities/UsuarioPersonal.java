package com.tiendaflics.tiendaflics_backend.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "Usuario_Personal")
@PrimaryKeyJoinColumn(name = "id_persona")
public class UsuarioPersonal extends Persona {

    @Column(name = "id_usuario", unique = true, nullable = false, length = 20)
    private String idUsuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rol rol;

    @Column(nullable = false, length = 255)
    private String password;

    private Boolean activo = true;

    public enum Rol {
        ADMIN, VENDEDOR
    }

    public UsuarioPersonal() {}

    // Getters y Setters
    public String getIdUsuario() { return idUsuario; }
    public void setIdUsuario(String idUsuario) { this.idUsuario = idUsuario; }

    public Rol getRol() { return rol; }
    public void setRol(Rol rol) { this.rol = rol; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
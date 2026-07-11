package com.tiendaflics.tiendaflics_backend.repositories;

import com.tiendaflics.tiendaflics_backend.entities.UsuarioPersonal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioPersonalRepository extends JpaRepository<UsuarioPersonal, Integer> {

    // Método clave para el login: busca al usuario y verifica que no esté dado de baja
    Optional<UsuarioPersonal> findByIdUsuarioAndActivoTrue(String idUsuario);
}
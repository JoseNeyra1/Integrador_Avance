package com.tiendaflics.tiendaflics_backend.repositories;

import com.tiendaflics.tiendaflics_backend.entities.Persona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PersonaRepository extends JpaRepository<Persona, Integer> {
    // Spring Boot crea la consulta SQL automáticamente solo con leer el nombre del método
    Optional<Persona> findByEmail(String email);
}
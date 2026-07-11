package com.tiendaflics.tiendaflics_backend.repositories;

import com.tiendaflics.tiendaflics_backend.entities.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Integer> {

    // Método para buscar si un proveedor ya existe mediante su RUC o DNI
    Optional<Proveedor> findByRucDni(String rucDni);
}
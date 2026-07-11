package com.tiendaflics.tiendaflics_backend.repositories;

import com.tiendaflics.tiendaflics_backend.entities.MetodoPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MetodoPagoRepository extends JpaRepository<MetodoPago, Integer> {
}
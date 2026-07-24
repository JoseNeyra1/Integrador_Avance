package com.tiendaflics.tiendaflics_backend.repositories;

import com.tiendaflics.tiendaflics_backend.entities.DetallePedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetallePedidoRepository extends JpaRepository<DetallePedido, Integer> {
    List<DetallePedido> findByPedidoIdPedido(Integer idPedido);
}
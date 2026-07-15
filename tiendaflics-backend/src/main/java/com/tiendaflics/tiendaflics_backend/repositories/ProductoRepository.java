package com.tiendaflics.tiendaflics_backend.repositories;

import com.tiendaflics.tiendaflics_backend.entities.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    // Método automático para buscar por código de barras (ideal para el cajero)
    Optional<Producto> findByCodigoBarras(String codigoBarras);

    // Método automático para el catálogo de la página web (solo productos activos y por categoría)
    List<Producto> findByCategoriaIdCategoriaAndActivoTrue(Integer idCategoria);

    // Listado general: solo productos no eliminados lógicamente
    List<Producto> findByActivoTrue();
}
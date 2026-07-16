package com.tiendaflics.tiendaflics_backend.controllers;

import com.tiendaflics.tiendaflics_backend.entities.Categoria;
import com.tiendaflics.tiendaflics_backend.entities.Producto;
import com.tiendaflics.tiendaflics_backend.exceptions.RecursoNoEncontradoException;
import com.tiendaflics.tiendaflics_backend.exceptions.ReglaDeNegocioException;
import com.tiendaflics.tiendaflics_backend.repositories.CategoriaRepository;
import com.tiendaflics.tiendaflics_backend.repositories.ProductoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@CrossOrigin(origins = "*")
public class CategoriaController {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @GetMapping
    public List<Categoria> listar() {
        return categoriaRepository.findByActivoTrue();
    }

    @PostMapping
    public Categoria crear(@Valid @RequestBody Categoria categoria) {
        categoria.setIdCategoria(null);
        categoria.setActivo(true);
        return categoriaRepository.save(categoria);
    }

    @PutMapping("/{id}")
    public Categoria actualizar(@PathVariable Integer id, @Valid @RequestBody Categoria categoria) {
        Categoria existente = categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));
        existente.setNombre(categoria.getNombre());
        existente.setImagenUrl(categoria.getImagenUrl());
        return categoriaRepository.save(existente);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        Categoria existente = categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));

        List<Producto> productosActivos = productoRepository.findByCategoriaIdCategoriaAndActivoTrue(id);
        if (!productosActivos.isEmpty()) {
            throw new ReglaDeNegocioException("No se puede eliminar: hay " + productosActivos.size() + " producto(s) activo(s) en esta categoría");
        }

        existente.setActivo(false);
        categoriaRepository.save(existente);
        return ResponseEntity.noContent().build();
    }
}

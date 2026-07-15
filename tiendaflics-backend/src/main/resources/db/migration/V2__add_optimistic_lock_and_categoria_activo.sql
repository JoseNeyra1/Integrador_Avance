-- Agrega lock optimista a Producto (evita condiciones de carrera al descontar stock concurrentemente)
-- y el flag "activo" a Categoria (mismo patrón de borrado lógico que ya usa Producto).
ALTER TABLE Producto ADD COLUMN version BIGINT DEFAULT 0;
ALTER TABLE Categoria ADD COLUMN activo BOOLEAN DEFAULT TRUE;

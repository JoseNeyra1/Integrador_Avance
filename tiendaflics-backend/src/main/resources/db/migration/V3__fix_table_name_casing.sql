-- Hibernate siempre busca los nombres de tabla en minusculas (SpringPhysicalNamingStrategy).
-- En Windows, MySQL no distingue mayusculas/minusculas en nombres de tabla, asi que este
-- desajuste quedaba oculto en desarrollo local. En servidores Linux (la mayoria del hosting
-- en la nube), MySQL SI distingue mayusculas/minusculas, y la migracion V1 creo las tablas
-- con mayuscula inicial. Este script las renombra a minuscula para que coincidan con lo que
-- Hibernate espera en cualquier sistema operativo.
--
-- Se usa un nombre temporal en cada rename para que tambien funcione sin errores en sistemas
-- donde mayuscula/minuscula ya se trata como el mismo nombre (ej. Windows).

RENAME TABLE Persona TO persona_tmp;
RENAME TABLE persona_tmp TO persona;

RENAME TABLE Usuario_Personal TO usuario_personal_tmp;
RENAME TABLE usuario_personal_tmp TO usuario_personal;

RENAME TABLE Proveedor TO proveedor_tmp;
RENAME TABLE proveedor_tmp TO proveedor;

RENAME TABLE Cliente TO cliente_tmp;
RENAME TABLE cliente_tmp TO cliente;

RENAME TABLE Categoria TO categoria_tmp;
RENAME TABLE categoria_tmp TO categoria;

RENAME TABLE Producto TO producto_tmp;
RENAME TABLE producto_tmp TO producto;

RENAME TABLE Pedido TO pedido_tmp;
RENAME TABLE pedido_tmp TO pedido;

RENAME TABLE Detalle_Pedido TO detalle_pedido_tmp;
RENAME TABLE detalle_pedido_tmp TO detalle_pedido;

RENAME TABLE Historial_Estado TO historial_estado_tmp;
RENAME TABLE historial_estado_tmp TO historial_estado;

RENAME TABLE Metodo_Pago TO metodo_pago_tmp;
RENAME TABLE metodo_pago_tmp TO metodo_pago;

RENAME TABLE Venta TO venta_tmp;
RENAME TABLE venta_tmp TO venta;

RENAME TABLE Detalle_Venta TO detalle_venta_tmp;
RENAME TABLE detalle_venta_tmp TO detalle_venta;

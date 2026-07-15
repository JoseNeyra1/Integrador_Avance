-- Esquema base de TiendaFlics, tal como existía antes de introducir Flyway.
-- En el entorno de desarrollo actual esta migración se marca como "baseline" (no se ejecuta,
-- ya que las tablas ya existen). Sirve para levantar un entorno completamente nuevo (ej. Render/Railway)
-- desde cero con el mismo esquema.

CREATE TABLE IF NOT EXISTS Persona (
    id_persona INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(20) UNIQUE,
    telefono VARCHAR(15),
    direccion VARCHAR(150),
    email VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Usuario_Personal (
    id_persona INT PRIMARY KEY,
    id_usuario VARCHAR(20) NOT NULL UNIQUE,
    rol VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_usuario_personal_persona FOREIGN KEY (id_persona) REFERENCES Persona(id_persona)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Proveedor (
    id_persona INT PRIMARY KEY,
    ruc_dni VARCHAR(20) NOT NULL UNIQUE,
    empresa VARCHAR(100) NOT NULL,
    rubro VARCHAR(100),
    CONSTRAINT fk_proveedor_persona FOREIGN KEY (id_persona) REFERENCES Persona(id_persona)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Cliente (
    id_persona INT PRIMARY KEY,
    puntos_lealtad INT,
    password VARCHAR(255),
    CONSTRAINT fk_cliente_persona FOREIGN KEY (id_persona) REFERENCES Persona(id_persona)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Producto (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_venta DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    codigo_barras VARCHAR(50) UNIQUE,
    imagen_url VARCHAR(500),
    activo BOOLEAN DEFAULT TRUE,
    id_categoria INT,
    CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME,
    total DECIMAL(10,2),
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    comprobante_yape VARCHAR(255),
    delivery BOOLEAN DEFAULT FALSE,
    costo_delivery DECIMAL(10,2) DEFAULT 0,
    id_cliente INT,
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (id_cliente) REFERENCES Cliente(id_persona)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Detalle_Pedido (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    id_producto INT,
    cantidad INT,
    precio_compra DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    CONSTRAINT fk_detalle_pedido_pedido FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido),
    CONSTRAINT fk_detalle_pedido_producto FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Historial_Estado (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    fecha_cambio DATETIME NOT NULL,
    CONSTRAINT fk_historial_pedido FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Metodo_Pago (
    id_metodo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Venta (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME,
    total DECIMAL(10,2) DEFAULT 0,
    id_vendedor INT NOT NULL,
    id_cliente INT,
    id_metodo INT NOT NULL,
    CONSTRAINT fk_venta_vendedor FOREIGN KEY (id_vendedor) REFERENCES Usuario_Personal(id_persona),
    CONSTRAINT fk_venta_cliente FOREIGN KEY (id_cliente) REFERENCES Cliente(id_persona),
    CONSTRAINT fk_venta_metodo FOREIGN KEY (id_metodo) REFERENCES Metodo_Pago(id_metodo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Detalle_Venta (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unidad DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_detalle_venta_venta FOREIGN KEY (id_venta) REFERENCES Venta(id_venta),
    CONSTRAINT fk_detalle_venta_producto FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
) ENGINE=InnoDB;

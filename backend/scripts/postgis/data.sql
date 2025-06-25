BEGIN;

-- Insertar usuario admin si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM usuario WHERE email = 'admin@admin.com'
    ) THEN
        INSERT INTO usuario (email, contrasenia, nombre_usuario, rol)
        VALUES ('admin@admin.com', 'admin', 'admin', 'admin');
    ELSE
        RAISE NOTICE 'Usuario admin ya existe.';
    END IF;
END
$$;

-- Insertar empresas, si no existen
INSERT INTO empresas (id, nombre) VALUES
(1, 'COT'),
(2, 'COPSA'),
(3, 'TURIL'),
(4, 'CYNSA'),
(5, 'EGA'),
(6, 'RUTAS DEL SOL'),
(7, 'NUÑEZ'),
(8, 'CITA'),
(9, 'COTMI'),
(10, 'TAMBORES')
ON CONFLICT (id) DO NOTHING;

COMMIT;

BEGIN;

CREATE TABLE IF NOT EXISTS usuario (
    email VARCHAR(255) PRIMARY KEY,
    contrasenia VARCHAR(255),
    nombre_usuario VARCHAR(255),
    rol VARCHAR(255)
);

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

COMMIT;

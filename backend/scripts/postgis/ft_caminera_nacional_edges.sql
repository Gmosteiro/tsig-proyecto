CREATE EXTENSION IF NOT EXISTS pgrouting;

-- 1. Explode MultiLineStrings to LineStrings (if needed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ft_caminera_nacional_edges') THEN
        CREATE TABLE ft_caminera_nacional_edges AS
        SELECT 
            gid,
            (ST_Dump(geom)).geom::geometry(LineString, 4326) AS geom,
            sentido
        FROM ft_caminera_nacional;
    END IF;
END$$;

-- 2. Add required columns if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='ft_caminera_nacional_edges' AND column_name='id'
    ) THEN
        ALTER TABLE ft_caminera_nacional_edges ADD COLUMN id serial PRIMARY KEY;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='ft_caminera_nacional_edges' AND column_name='source'
    ) THEN
        ALTER TABLE ft_caminera_nacional_edges ADD COLUMN source integer;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='ft_caminera_nacional_edges' AND column_name='target'
    ) THEN
        ALTER TABLE ft_caminera_nacional_edges ADD COLUMN target integer;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='ft_caminera_nacional_edges' AND column_name='cost'
    ) THEN
        ALTER TABLE ft_caminera_nacional_edges ADD COLUMN cost double precision;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='ft_caminera_nacional_edges' AND column_name='reverse_cost'
    ) THEN
        ALTER TABLE ft_caminera_nacional_edges ADD COLUMN reverse_cost double precision;
    END IF;
END$$;

-- 3. Create topology (always run after columns exist)
SELECT pgr_createTopology('ft_caminera_nacional_edges', 0.0001, 'geom', 'id');

-- 4. Set costs según sentido
UPDATE ft_caminera_nacional_edges
SET
  cost = ST_Length(geom::geography),
  reverse_cost = ST_Length(geom::geography)
WHERE sentido IS NULL
   OR sentido = 'CIRCULACIÓN EN AMBOS SENTIDOS'
   OR sentido = 'SIN DEFINIR';

UPDATE ft_caminera_nacional_edges
SET
  cost = ST_Length(geom::geography),
  reverse_cost = -1
WHERE sentido = 'EL SENTIDO DE CIRCULACIÓN COINCIDE CON EL DE DIGITALIZACIÓN';
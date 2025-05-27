CREATE EXTENSION IF NOT EXISTS pgrouting;

-- 1. Explode MultiLineStrings to LineStrings (if needed)

CREATE TABLE ft_caminera_nacional_edges AS
SELECT 
  gid,
  (ST_Dump(geom)).geom::geometry(LineString, 4326) AS geom
FROM ft_caminera_nacional;

-- 2. Add required columns
ALTER TABLE ft_caminera_nacional_edges ADD COLUMN id serial PRIMARY KEY;
ALTER TABLE ft_caminera_nacional_edges ADD COLUMN source integer;
ALTER TABLE ft_caminera_nacional_edges ADD COLUMN target integer;
ALTER TABLE ft_caminera_nacional_edges ADD COLUMN cost double precision;
ALTER TABLE ft_caminera_nacional_edges ADD COLUMN reverse_cost double precision;

-- 3. Create topology
SELECT pgr_createTopology('ft_caminera_nacional_edges', 0.0001, 'geom', 'id');

-- 4. Set costs
UPDATE ft_caminera_nacional_edges SET cost = ST_Length(geom::geography);
UPDATE ft_caminera_nacional_edges SET reverse_cost = cost;
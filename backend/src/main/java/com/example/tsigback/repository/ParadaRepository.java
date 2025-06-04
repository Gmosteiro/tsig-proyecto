package com.example.tsigback.repository;

import com.example.tsigback.entities.Parada;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParadaRepository extends JpaRepository<Parada, Integer> {

    //3857 hace referencia a SRID y son metros
    @Query(value = """
    SELECT COUNT(*) > 0
    FROM ft_caminera_nacional
    WHERE ST_DWithin(
        ST_Transform(geom, 3857),
        ST_Transform(:punto , 3857),
        :distancia
    )
    """, nativeQuery = true)
    boolean isRutaCercana(@Param("punto") Point ubicacion,@Param("distancia") Double buffer);

    Parada findByNombre(String nombre);
}

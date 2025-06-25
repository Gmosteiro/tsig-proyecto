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

    @Query(value = """
        SELECT COUNT(*) > 0
        FROM parada
        WHERE ST_DWithin(
            ST_Transform(ubicacion, 3857),
            ST_Transform(:punto, 3857),
            :distancia
        )
    """, nativeQuery = true)
    boolean existeParadaCercaDePunto(@Param("punto") Point punto, @Param("distancia") double distancia);

    @Query(value = """
        SELECT COUNT(*) > 0
        FROM parada p, linea l
        WHERE p.id = :paradaId 
        AND l.id = :lineaId
        AND ST_DWithin(
            ST_Transform(p.ubicacion, 3857),
            ST_Transform(l.puntos, 3857),
            :distancia
        )
    """, nativeQuery = true)
    boolean esParadaCercanaALinea(@Param("paradaId") Long paradaId, 
                                  @Param("lineaId") Long lineaId, 
                                  @Param("distancia") double distancia);

}

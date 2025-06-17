package com.example.tsigback.repository;

import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.tsigback.entities.Linea;

@Repository
public interface LineaRepository extends JpaRepository<Linea, Integer> {

    @Query(value = """
        SELECT nombre 
        FROM ft_departamentos
        WHERE ST_Contains(geom, :punto)
        LIMIT 1
        """, nativeQuery = true)
    String obtenerDepartamentoOrigen(@Param("punto") Point puntoOrigen);

    @Query(value = """
        SELECT nombre 
        FROM ft_departamentos
        WHERE ST_Contains(geom, :punto)
        LIMIT 1
        """, nativeQuery = true)
    String obtenerDepartamentoDestino(@Param("punto") Point puntoDestino);

    @Query(value = """
    SELECT EXISTS (
        SELECT 1
        FROM linea
        WHERE id = :lineaId
            ST_DWithin(
            ST_Transform(:nuevoRecorrido, 3857),
            ST_Transform(:punto, 3857),
            :margen
        )
    )
    """, nativeQuery = true)
    boolean isPuntoCercaDeAlgunaLinea(@Param("lineaId") int lineaId, 
                            @Param("punto") Point punto, 
                            @Param("margen") int margen,
                            @Param("nuevoRecorrido") MultiLineString nuevoRecorrido);
}

package com.example.tsigback.repository;

import java.util.List;

import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.tsigback.entities.ParadaLinea;

import jakarta.transaction.Transactional;

public interface ParadaLineaRepository extends JpaRepository<ParadaLinea, Integer> {
    
    @Modifying
    @Transactional
    @Query("UPDATE ParadaLinea pl SET pl.estaHabilitada = false WHERE pl.parada.id = :paradaId")
    void deshabilitarPorParadaId(@Param("paradaId") int paradaId);

    List<ParadaLinea> findByParadaId(int paradaId);

    List<ParadaLinea> findByLineaId(int lineaId);

    List<ParadaLinea> findByParadaIdAndEstaHabilitadaTrue(int paradaId);

    List<ParadaLinea> findByParadaIdOrderByIdAsc(int paradaId);

    ParadaLinea findByParadaIdAndLineaId(int paradaId, int lineaId);

    @Query(value = """
        WITH line_geom AS (
            SELECT 
                CASE 
                    WHEN ST_GeometryType(ST_LineMerge(l.recorrido)) = 'ST_LineString' 
                    THEN ST_LineMerge(l.recorrido)
                    ELSE (
                        SELECT ST_GeometryN(ST_LineMerge(l.recorrido), n)
                        FROM generate_series(1, ST_NumGeometries(ST_LineMerge(l.recorrido))) n
                        ORDER BY ST_Length(ST_GeometryN(ST_LineMerge(l.recorrido), n)) DESC
                        LIMIT 1
                    )
                END as line_geom
            FROM linea l 
            WHERE l.id = :lineaId
        )
        SELECT pl.*
        FROM parada_linea pl
        JOIN parada p ON p.id = pl.parada_id
        JOIN linea l ON l.id = pl.linea_id
        CROSS JOIN line_geom lg
        WHERE pl.linea_id = :lineaId
        ORDER BY ST_LineLocatePoint(
            lg.line_geom,
            ST_ClosestPoint(lg.line_geom, p.ubicacion)
        )
    """, nativeQuery = true)
    List<ParadaLinea> findByLineaIdOrderedByRecorrido(@Param("lineaId") int lineaId);
}


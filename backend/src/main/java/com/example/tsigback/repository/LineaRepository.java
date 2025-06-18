package com.example.tsigback.repository;

import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.tsigback.entities.Linea;

import java.util.List;

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


    @Query(value = """
    SELECT l.*
    FROM linea l
    JOIN ft_departamentos dep_o on dep_o.nombre = l.origen
    JOIN ft_departamentos dep_d on dep_d.nombre = l.destino
    WHERE dep_o.gid = :idDepartamentoOrigen and dep_d.gid = :idDepartamentoDestino
    """, nativeQuery = true)
    List<Linea> findByOrigenAndDestino(@Param("idDepartamentoOrigen") int idDepartamentoOrigen, 
                                     @Param("idDepartamentoDestino") int idDepartamentoDestino);

    @Query(value = """
    SELECT l.*
    FROM linea l
    JOIN ft_postes p ON p.ruta = :ruta AND p.km = :kilometro
    WHERE ST_DWithin(
    ST_Transform(l.recorrido, 3857),
    ST_Transform(p.geom, 3857),
    20
    )
    """, nativeQuery = true)
    List<Linea> findByRutaAndKilometro(@Param("ruta") int ruta,
                                    @Param("kilometro") int kilometro);


}

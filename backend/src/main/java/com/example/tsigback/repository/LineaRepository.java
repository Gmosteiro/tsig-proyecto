package com.example.tsigback.repository;

import java.util.List;
import java.util.Optional;

import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.tsigback.entities.Linea;

@Repository
public interface LineaRepository extends JpaRepository<Linea, Integer> {

    Optional<Linea> findById(int id);

    List<Linea> findByDestino(String destino);

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
                FROM  linea
                WHERE id = :id
                AND ST_DWithin(
                          ST_Transform(recorrido, 3857),
                          ST_Transform(:parada,   3857),
                          :distancia
                       )
            )
            """, nativeQuery = true)
    Boolean esParadaCercaDelRecorrido(
            @Param("parada") Point parada,
            @Param("id") int id,
            @Param("distancia") double distancia);

    @Query(value = """
            SELECT ST_DWithin(
                     ST_Transform(:nuevoRecorrido, 3857),
                     ST_Transform(:punto,          3857),
                     :margen
                   )
            """, nativeQuery = true)
    Boolean esNuevaParadaCercaDeParada(
            @Param("nuevoRecorrido") MultiLineString nuevoRecorrido,
            @Param("punto") Point punto,
            @Param("margen") double margen);

    //boolean isPuntoCercaDeAlgunaLinea(@Param("lineaId") int lineaId,
    //        @Param("punto") Point punto,
    //        @Param("margen") int margen,
    //        @Param("nuevoRecorrido") MultiLineString nuevoRecorrido);

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

    @Query(value = """
            SELECT l.*
            FROM linea l
            WHERE ST_Intersects(
                l.recorrido,
                ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)
            )
            """, nativeQuery = true)
    List<Linea> findByRecorridoIntersectaPoligono(@Param("geojson") String geojson);

    @Query(value = """
            SELECT l.*
            FROM linea l
            WHERE l.empresa = :empresa
            """, nativeQuery = true)
    List<Linea> findByEmpresaNombre(@Param("empresa") String empresa);

    @Query(value = """
            SELECT DISTINCT l.*
            FROM linea l
            JOIN parada_linea pl ON pl.linea_id = l.id
            JOIN horario_parada_linea hpl ON hpl.parada_linea_id = pl.id
            WHERE hpl.horario BETWEEN CAST(:horaDesde AS time) AND CAST(:horaHasta AS time)
            """, nativeQuery = true)
    List<Linea> findLineasActivasEnRango(@Param("horaDesde") String horaDesde, @Param("horaHasta") String horaHasta);

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
}

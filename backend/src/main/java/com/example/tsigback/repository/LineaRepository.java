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
        @Param("parada")    Point   parada,
        @Param("id")        int     id,
        @Param("distancia") double  distancia);   
    


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

    

}

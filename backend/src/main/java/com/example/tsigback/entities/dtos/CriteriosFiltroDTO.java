package com.example.tsigback.entities.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para los criterios de filtrado que envía el frontend
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CriteriosFiltroDTO {
    
    /**
     * Filtro por empresa
     */
    private String empresa;
    
    /**
     * Filtro por departamento de origen (ID)
     */
    private Integer idDepartamentoOrigen;
    
    /**
     * Filtro por departamento de destino (ID)
     */
    private Integer idDepartamentoDestino;
    
    /**
     * Filtro por ruta
     */
    private Integer ruta;
    
    /**
     * Filtro por kilómetro
     */
    private Integer kilometro;
    
    /**
     * Filtro por polígono (GeoJSON)
     */
    private String poligonoGeoJSON;
    
    /**
     * Filtro por líneas específicas (IDs)
     */
    private java.util.List<Integer> idsLineas;
    
    /**
     * Filtro por estado habilitado
     */
    private Boolean estaHabilitada;
    
    /**
     * Filtro por parada cercana (ID de parada)
     */
    private Integer idParadaCercana;
}

package com.example.tsigback.entities.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para los filtros CQL que se aplican en WMS
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FiltroWMSDTO {
    
    /**
     * Filtro CQL para la capa de líneas
     */
    private String filtroLineas;
    
    /**
     * Filtro CQL para la capa de paradas
     */
    private String filtroParadas;
    
    /**
     * Indica si se encontraron resultados para aplicar filtros
     */
    private boolean tieneResultados;
    
    /**
     * Número total de líneas que cumplen el filtro
     */
    private int totalLineas;
    
    /**
     * Número total de paradas asociadas a las líneas filtradas
     */
    private int totalParadas;
}

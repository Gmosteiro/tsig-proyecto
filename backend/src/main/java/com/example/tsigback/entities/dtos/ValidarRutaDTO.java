package com.example.tsigback.entities.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ValidarRutaDTO {
    private String routeGeoJSON; // GeoJSON LineString de la ruta generada
}

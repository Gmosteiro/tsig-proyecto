package com.example.tsigback.entities.dtos;

import com.example.tsigback.entities.enums.EstadoParada;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ParadaDTO {
    private String nombre;
    private EstadoParada estado;
    private boolean refugio;
    private String observacion;
    private double latitud;
    private double longitud;
}

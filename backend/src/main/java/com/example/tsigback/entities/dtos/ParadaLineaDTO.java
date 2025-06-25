package com.example.tsigback.entities.dtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ParadaLineaDTO {
    private int idParadaLinea;
    private int idParada;
    private int idLinea;
    private boolean estaHabilitada;
    private List<HorarioDTO> horarios;
    
    // Información adicional de la parada para mostrar en listas
    private String nombreParada;
    private double latitudParada;
    private double longitudParada;
}

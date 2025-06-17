package com.example.tsigback.entities.dtos;

import java.util.List;

import com.example.tsigback.entities.ParadaLinea;
import com.example.tsigback.entities.enums.EstadoParada;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ParadaDTO {
    private int id;
    private String nombre;
    private EstadoParada estado;
    private boolean refugio;
    private String observacion;
    private double latitud;
    private double longitud;
    private List<ParadaLinea> lineas;
}

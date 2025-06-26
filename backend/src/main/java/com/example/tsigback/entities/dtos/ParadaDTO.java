package com.example.tsigback.entities.dtos;

import java.util.List;

import com.example.tsigback.entities.ParadaLinea;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor  // Añadir constructor sin argumentos para Jackson
public class ParadaDTO {
    private int id;
    private String nombre;
    private boolean habilitada; // true = habilitada, false = deshabilitada
    private boolean refugio;
    private String observacion;
    private double latitud;
    private double longitud;
    private List<ParadaLinea> lineas;
}

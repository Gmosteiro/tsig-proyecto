package com.example.tsigback.entities.dtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class LineaDTO {
    private int id;
    private String descripcion;
    private String empresa;
    private String observacion;
    private String origen;
    private String destino;
    private boolean estaHabilitada;
    private List<PuntoDTO> puntos;
    private String rutaGeoJSON;
    private String recorrido;
    private List<Integer> paradaLineaIds;
}

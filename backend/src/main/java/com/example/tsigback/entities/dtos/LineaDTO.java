package com.example.tsigback.entities.dtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LineaDTO {
    private Long id;
    private String nombre;
    private String descripcion;
    private String empresa;
    private String observacion;
    private List<PuntoDTO> puntos;
}

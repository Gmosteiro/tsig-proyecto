package com.example.tsigback.entities.dtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ParadaLineaDTO {
    private int idParada;
    private int idLinea;
    private List<HorariosDTO> horario;
}

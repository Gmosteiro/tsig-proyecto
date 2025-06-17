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
    private List<HorarioDTO> horarios;
}

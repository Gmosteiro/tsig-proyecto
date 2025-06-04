package com.example.tsigback.entities.dtos;


import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParadaLineaDTO {
    
    private int paradaId;
    private int lineaId;
    
    @JsonFormat(pattern = "HH:mm")
    private LocalTime horario;
}

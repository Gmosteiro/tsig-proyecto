package com.example.tsigback.entities.dtos;

import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class HorarioDTO {

    private Integer id;
    
    @JsonFormat(pattern = "HH:mm")
    private LocalTime hora;
}

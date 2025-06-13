package com.example.tsigback.entities.dtos;

import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class HorariosDTO {

    @JsonFormat(pattern = "HH:mm")
    private LocalTime hora;
}

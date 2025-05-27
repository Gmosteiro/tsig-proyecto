package com.example.tsigback.entities.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class RoutingRequestDTO {
    private double latitud;
    private double longitud;
}
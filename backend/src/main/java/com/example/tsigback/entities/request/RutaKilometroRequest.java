package com.example.tsigback.entities.request;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RutaKilometroRequest {
    private int ruta;
    private int kilometro;
}

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
public class OrigenDestinoRequest {
    private int idDepartamentoOrigen;
    private int idDepartamentoDestino;
}

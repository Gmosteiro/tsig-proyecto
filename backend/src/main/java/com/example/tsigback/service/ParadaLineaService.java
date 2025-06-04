package com.example.tsigback.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.tsigback.entities.Linea;
import com.example.tsigback.entities.Parada;
import com.example.tsigback.entities.ParadaLinea;
import com.example.tsigback.entities.dtos.ParadaLineaDTO;
import com.example.tsigback.exception.LineaNoEncontradaException;
import com.example.tsigback.exception.ParadaNoEncontradaException;
import com.example.tsigback.repository.ParadaLineaRepository;

@Service
public class ParadaLineaService {

    @Autowired
    private ParadaService paradaService;

    @Autowired
    private LineaService lineaService;

    @Autowired
    private ParadaLineaRepository paradaLineaRepository;

    public void altaParadaLinea(ParadaLineaDTO paradaLineaDTO) throws ParadaNoEncontradaException, LineaNoEncontradaException {
        Parada parada = paradaService.buscarParadaPorId(paradaLineaDTO.getParadaId());
        Linea linea = lineaService.buscarLineaPorId(paradaLineaDTO.getLineaId());

        if (parada == null) { 
            throw new ParadaNoEncontradaException("Parada no encontrada");
        }
        if (linea == null) {
            throw new LineaNoEncontradaException("Línea no encontrada");
        }

        ParadaLinea paradaLinea = ParadaLinea.builder()
                .parada(parada)
                .linea(linea)
                .horario(paradaLineaDTO.getHorario())
                .deshabilitado(false)
                .build();

        paradaLineaRepository.save(paradaLinea);
    }
}

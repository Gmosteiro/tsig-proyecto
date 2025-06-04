package com.example.tsigback.service;

import com.example.tsigback.entities.Parada;
import com.example.tsigback.entities.dtos.ParadaDTO;
import com.example.tsigback.exception.ParadaLejosDeRutaException;
import com.example.tsigback.exception.ParadaNoEncontradaException;
import com.example.tsigback.repository.ParadaRepository;
import com.example.tsigback.utils.GeoUtils;

import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ParadaService {

    private final static Double DEFAULT_BUFFER = 100.0;

    @Autowired
    private ParadaRepository paradaRepository;

    public void altaParada(ParadaDTO paradaDTO) throws ParadaLejosDeRutaException {
        Point ubicacion = GeoUtils.crearPunto(paradaDTO.getLongitud(), paradaDTO.getLatitud());

        if (ubicacion == null) {
            throw new RuntimeException("No se puede crear un ubicacion");
        }

        if (!paradaRepository.isRutaCercana(ubicacion,DEFAULT_BUFFER)) {
            throw new ParadaLejosDeRutaException("Esta ingresando una parada a una distancia mayor de " + DEFAULT_BUFFER + "mt de una ruta nacional ");
        }

        Parada nuevaParada = Parada.builder()
                .ubicacion(ubicacion)
                .nombre(paradaDTO.getNombre())
                .estado(paradaDTO.getEstado())
                .refugio(paradaDTO.isRefugio())
                .observacion(paradaDTO.getObservacion())
                .build();

        paradaRepository.save(nuevaParada);
    }

    public void modificarParada(ParadaDTO paradaDTO) throws ParadaNoEncontradaException, ParadaLejosDeRutaException {
        Parada parada = paradaRepository.findByNombre(paradaDTO.getNombre());

        if (parada == null) {
            throw new ParadaNoEncontradaException("Parada con nombre " + paradaDTO.getNombre() + " no encontrada");
        }

        Point ubicacion = GeoUtils.crearPunto(paradaDTO.getLongitud(), paradaDTO.getLatitud());

        if (!paradaRepository.isRutaCercana(ubicacion,DEFAULT_BUFFER)) {
            throw new ParadaLejosDeRutaException("Esta ingresando una parada a una distancia mayor de " + DEFAULT_BUFFER + "mt de una ruta nacional ");
        }

        Parada paradaModificada = Parada.builder()
                .ubicacion(ubicacion)
                .nombre(paradaDTO.getNombre())
                .estado(paradaDTO.getEstado())
                .refugio(paradaDTO.isRefugio())
                .observacion(paradaDTO.getObservacion())
                .build();

        paradaRepository.save(paradaModificada);
    }

    public void eliminarParada(String nombre) throws ParadaNoEncontradaException {
        Parada parada = paradaRepository.findByNombre(nombre);

        if (parada == null) {
            throw new ParadaNoEncontradaException("Parada con nombre " + nombre + " no encontrada");
        }

        paradaRepository.delete(parada);
    }
}

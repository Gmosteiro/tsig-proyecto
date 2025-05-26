package com.example.tsigback.service;

import com.example.tsigback.entities.Parada;
import com.example.tsigback.entities.dtos.ParadaDTO;
import com.example.tsigback.exception.ParadaLejosDeRutaException;
import com.example.tsigback.repository.ParadaRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ParadaService {

    @Autowired
    private ParadaRepository paradaRepository;

    public void altaParada(ParadaDTO paradaDTO) throws ParadaLejosDeRutaException {
        Point ubicacion = crearUbicacion(paradaDTO.getLongitud(), paradaDTO.getLatitud());

        if (ubicacion == null) {
            throw new RuntimeException("No se puede crear un ubicacion");
        }

        double margen = 100.0;

        if (!paradaRepository.isRutaCercana(ubicacion,margen)) {
            throw new ParadaLejosDeRutaException("Esta ingresando una parada a una distancia mayor de " + margen + "mt de una ruta nacional ");
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

    private Point crearUbicacion(double longitud, double latitud) {
        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        return geometryFactory.createPoint(new Coordinate(longitud, latitud));
    }
}

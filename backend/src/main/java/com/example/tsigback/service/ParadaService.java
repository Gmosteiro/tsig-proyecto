package com.example.tsigback.service;

import com.example.tsigback.entities.Parada;
import com.example.tsigback.entities.dtos.ParadaDTO;
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

    public void altaParada(ParadaDTO paradaDTO) {
        Parada parada = dtoAEntidad(paradaDTO);
        paradaRepository.save(parada);
    }

    public Parada dtoAEntidad(ParadaDTO dto) {
        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        Point ubicacion = geometryFactory.createPoint(new Coordinate(dto.getLongitud(), dto.getLatitud()));

        return Parada.builder()
                .ubicacion(ubicacion)
                .nombre(dto.getNombre())
                .estado(dto.getEstado())
                .refugio(dto.isRefugio())
                .observacion(dto.getObservacion())
                .build();
    }
}

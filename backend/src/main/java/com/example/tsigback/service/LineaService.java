package com.example.tsigback.service;

import com.example.tsigback.entities.Linea;
import com.example.tsigback.entities.dtos.LineaDTO;
import com.example.tsigback.entities.dtos.PuntoDTO;
import com.example.tsigback.repository.LineaRepository;
import com.example.tsigback.repository.RoutingRepository;
import com.example.tsigback.utils.GeoUtils;

import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.geom.MultiPoint;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.io.geojson.GeoJsonWriter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class LineaService {

    @Autowired
    private LineaRepository lineaRepository;

    @Autowired
    private RoutingRepository routingRepository;

    private static final double MAX_DIST = 100.0; // metros

    public void crearLinea(LineaDTO linea) {
        try {
            System.out.println("DEBUG puntos recibidos: " + linea.getPuntos());
            System.out.println("DEBUG rutaGeoJSON recibido: " + linea.getRutaGeoJSON());
            if (linea.getRutaGeoJSON() == null || linea.getRutaGeoJSON().trim().isEmpty() || linea.getRutaGeoJSON().equals("null")) {
                throw new IllegalArgumentException("El campo rutaGeoJSON no puede ser nulo, vacío ni 'null'.");
            }
            MultiLineString recorrido = GeoUtils.geoJsonToMultiLineString(linea.getRutaGeoJSON());
            MultiPoint puntos = GeoUtils.crearMultiPointDesdeDTOs(linea.getPuntos());

            Point puntoOrigen = getPuntoDeOrigen(linea.getPuntos());
            Point puntoDestino = getPuntoDestino(linea.getPuntos());
            String origen = lineaRepository.obtenerDepartamentoOrigen(puntoOrigen);
            String destino = lineaRepository.obtenerDepartamentoDestino(puntoDestino);

            Linea nuevaLinea = Linea.builder()
                    .descripcion(linea.getDescripcion())
                    .empresa(linea.getEmpresa())
                    .origen(origen)
                    .destino(destino)
                    .observacion(linea.getObservacion())
                    .puntos(puntos)
                    .recorrido(recorrido)
                    .build();

            lineaRepository.save(nuevaLinea);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Error al crear la línea: " + e.getMessage(), e);
        }
    }

    private Point getPuntoDeOrigen(List<PuntoDTO> puntos) {
        PuntoDTO primerPuntoDTO = puntos.get(0);
        return GeoUtils.crearPunto(primerPuntoDTO.getLongitud(), primerPuntoDTO.getLatitud());
    }

    private Point getPuntoDestino(List<PuntoDTO> puntos) {
        PuntoDTO ultimoPuntoDTO = puntos.get(puntos.size() - 1);
        return GeoUtils.crearPunto(ultimoPuntoDTO.getLongitud(), ultimoPuntoDTO.getLatitud());
    }

    public List<PuntoDTO> crearPuntoDTO(double lon, double lat) {
        return List.of(new PuntoDTO(lon, lat));
    }

    public void validarDistanciaPuntosARed(List<PuntoDTO> puntos) {
        if (puntos == null || puntos.isEmpty()) {
            throw new IllegalArgumentException("Debe enviar al menos un punto.");
        }
        for (PuntoDTO pt : puntos) {
            Double dist = routingRepository.findNearestDistance(pt.getLongitud(), pt.getLatitud());
            if (dist == null) {
                throw new IllegalArgumentException("No se pudo calcular la distancia para el punto (" + pt.getLatitud() + ", " + pt.getLongitud() + ").");
            }
            if (dist > MAX_DIST) {
                throw new IllegalArgumentException("El punto (" + pt.getLatitud() + ", " + pt.getLongitud() + ") está a más de 100 metros de la red.");
            }
        }
    }
}
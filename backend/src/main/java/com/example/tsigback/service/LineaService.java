package com.example.tsigback.service;

import java.util.ArrayList;
import java.util.List;

import org.locationtech.jts.geom.*;
import org.locationtech.jts.io.geojson.GeoJsonWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.tsigback.entities.Linea;
import com.example.tsigback.entities.dtos.LineaDTO;
import com.example.tsigback.entities.dtos.PuntoDTO;
import com.example.tsigback.repository.LineaRepository;
import com.example.tsigback.repository.RoutingRepository;

@Service
public class LineaService {

    @Autowired
    private LineaRepository lineaRepository;

    @Autowired
    private RoutingRepository routingRepository;

    private static final double MAX_DIST = 100.0; // metros

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public void crearLinea(LineaDTO linea) {
        try {
            // Obtener la ruta como MultiLineString desde tu repositorio (debe ser de tipo JTS)
            MultiLineString recorrido = calculateRoute(linea.getPuntos());

            // Crear los puntos como un MultiPoint
            Coordinate[] coords = linea.getPuntos().stream()
                    .map(p -> new Coordinate(p.getLon(), p.getLat()))
                    .toArray(Coordinate[]::new);

            MultiPoint multiPoint = geometryFactory.createMultiPointFromCoords(coords);

            String origen = "Montevideo";
            String destino = "Punta del Este";

            Linea nuevaLinea = Linea.builder()
                    .descripcion(linea.getDescripcion())
                    .empresa(linea.getEmpresa())
                    .origen(origen)
                    .destino(destino)
                    .observacion(linea.getObservacion())
                    .puntos(multiPoint)
                    .recorrido(recorrido)
                    .build();

            lineaRepository.save(nuevaLinea);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Error al crear la línea: " + e.getMessage(), e);
        }
    }

    private MultiLineString calculateRoute(List<PuntoDTO> puntos) {
        if (puntos == null || puntos.size() < 2) {
            throw new IllegalArgumentException("Se requieren al menos dos puntos.");
        }

        List<Long> nodeIds = new ArrayList<>();
        for (PuntoDTO pt : puntos) {
            Long nodeId = routingRepository.findNearestSourceNode(pt.getLon(), pt.getLat());
            Double dist = routingRepository.findNearestDistance(pt.getLon(), pt.getLat());
            if (dist > MAX_DIST) {
                throw new IllegalArgumentException("Uno o más puntos están a más de 100 metros del nodo más cercano.");
            }
            if (nodeId == null) {
                throw new IllegalArgumentException("No se encontró nodo cercano para el punto (" + pt.getLat() + ", " + pt.getLon() + ").");
            }
            nodeIds.add(nodeId);
        }

        return routingRepository.calculateRouteMultiLineString(nodeIds);
    }

    public String calculateRouteGeoJSON(List<PuntoDTO> puntos) {
        MultiLineString multiLineString = calculateRoute(puntos);
        GeoJsonWriter writer = new GeoJsonWriter();
        return writer.write(multiLineString);
    }

    public List<PuntoDTO> crearPuntoDTO(double lon, double lat) {
        PuntoDTO punto = new PuntoDTO(lon, lat);
        return List.of(punto);
    }
}
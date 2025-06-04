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
            LineString recorrido = calculateRoute(linea.getPuntos());
            MultiPoint puntos = GeoUtils.crearMultiPointDesdeDTOs(linea.getPuntos());

            Linea nuevaLinea = Linea.builder()
                    .descripcion(linea.getDescripcion())
                    .empresa(linea.getEmpresa())
                    .origen("Montevideo")
                    .destino("Punta del Este")
                    .observacion(linea.getObservacion())
                    .puntos(puntos)
                    .recorrido(recorrido)
                    .build();

            lineaRepository.save(nuevaLinea);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Error al crear la línea: " + e.getMessage(), e);
        }
    }

    private LineString calculateRoute(List<PuntoDTO> puntos) {
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
        LineString lineString = calculateRoute(puntos);
        GeoJsonWriter writer = new GeoJsonWriter();
        return writer.write(lineString);
    }

    public List<PuntoDTO> crearPuntoDTO(double lon, double lat) {
        return List.of(new PuntoDTO(lon, lat));
    }
}
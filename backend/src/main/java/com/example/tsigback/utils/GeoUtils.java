package com.example.tsigback.utils;

import com.example.tsigback.entities.dtos.PuntoDTO;
import org.locationtech.jts.geom.*;
import org.locationtech.jts.io.geojson.GeoJsonReader;

import java.util.List;

public class GeoUtils {

    private static final int SRID = 4326;
    private static final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), SRID);

    public static Point crearPunto(double lon, double lat) {
        return geometryFactory.createPoint(new Coordinate(lon, lat));
    }

    public static MultiPoint crearMultiPointDesdeDTOs(List<PuntoDTO> puntos) {
        Coordinate[] coords = puntos.stream()
                .map(p -> new Coordinate(p.getLongitud(), p.getLatitud())) // <-- use latitud/longitud
                .toArray(Coordinate[]::new);
        MultiPoint multiPoint = geometryFactory.createMultiPointFromCoords(coords);
        multiPoint.setSRID(SRID);
        return multiPoint;
    }

    public static MultiLineString crearMultiLineString(List<Coordinate[]> lineSegments) {
        LineString[] lines = new LineString[lineSegments.size()];
        for (int i = 0; i < lineSegments.size(); i++) {
            lines[i] = geometryFactory.createLineString(lineSegments.get(i));
        }
        MultiLineString multiLineString = geometryFactory.createMultiLineString(lines);
        multiLineString.setSRID(SRID);
        return multiLineString;
    }

    public static MultiLineString fromPuntos(List<PuntoDTO> puntos) {
        if (puntos.size() < 2) {
            throw new IllegalArgumentException("Se necesitan al menos dos puntos.");
        }
        Coordinate[] coords = puntos.stream()
                .map(p -> new Coordinate(p.getLongitud(), p.getLatitud())) // <-- use latitud/longitud
                .toArray(Coordinate[]::new);
        LineString linea = geometryFactory.createLineString(coords);
        return geometryFactory.createMultiLineString(new LineString[]{linea});
    }

    public static MultiLineString geoJsonToMultiLineString(String geoJson) {
        try {
            GeoJsonReader reader = new GeoJsonReader();
            Geometry geometry = reader.read(geoJson);
            if (geometry instanceof MultiLineString) {
                return (MultiLineString) geometry;
            } else if (geometry.getGeometryType().equals("LineString")) {
                return geometry.getFactory().createMultiLineString(new org.locationtech.jts.geom.LineString[]{(org.locationtech.jts.geom.LineString) geometry});
            } else {
                throw new IllegalArgumentException("GeoJSON no es un MultiLineString ni LineString");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Error al parsear GeoJSON: " + e.getMessage(), e);
        }
    }
}
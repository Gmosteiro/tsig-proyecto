package com.example.tsigback.repository;

import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.io.WKTReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class RoutingRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final GeometryFactory geometryFactory = new GeometryFactory();

    public Long findNearestSourceNode(double lon, double lat) {
        return jdbcTemplate.queryForObject(
            "SELECT source " +
            "FROM ft_caminera_nacional " +
            "ORDER BY geom <-> ST_SetSRID(ST_MakePoint(?, ?), 4326) " +
            "LIMIT 1",
            Long.class, lon, lat
        );
    }

    public Double findNearestDistance(double lon, double lat) {
        return jdbcTemplate.queryForObject(
            "SELECT ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) " +
            "FROM ft_caminera_nacional " +
            "ORDER BY geom <-> ST_SetSRID(ST_MakePoint(?, ?), 4326) " +
            "LIMIT 1",
            Double.class, lon, lat, lon, lat
        );
    }
}

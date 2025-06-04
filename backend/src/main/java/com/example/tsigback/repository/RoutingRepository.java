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
            "FROM ft_caminera_nacional_edges " +
            "ORDER BY geom <-> ST_SetSRID(ST_MakePoint(?, ?), 4326) " +
            "LIMIT 1",
            Long.class, lon, lat
        );
    }

    public Double findNearestDistance(double lon, double lat) {
        return jdbcTemplate.queryForObject(
            "SELECT ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) " +
            "FROM ft_caminera_nacional_edges " +
            "ORDER BY geom <-> ST_SetSRID(ST_MakePoint(?, ?), 4326) " +
            "LIMIT 1",
            Double.class, lon, lat, lon, lat
        );
    }

    public LineString calculateRouteMultiLineString(List<Long> nodeIds) {
        StringBuilder viaNodes = new StringBuilder();
        for (Long id : nodeIds) {
            if (viaNodes.length() > 0) viaNodes.append(", ");
            viaNodes.append(id);
        }

        String sql =
            "SELECT ST_AsText(ST_Multi(ST_LineMerge(ST_Union(geom)))) AS wkt " +
            "FROM ft_caminera_nacional_edges " +
            "WHERE id IN (" +
            "  SELECT edge " +
            "  FROM pgr_dijkstraVia( " +
            "    'SELECT id, source, target, cost, reverse_cost FROM ft_caminera_nacional_edges', " +
            "    ARRAY[" + viaNodes + "], " +
            "    directed := true " +
            "  )" +
            ")";
            

        String wkt = jdbcTemplate.queryForObject(sql, String.class);

        try {
        WKTReader reader = new WKTReader(geometryFactory);
        Geometry geom = reader.read(wkt);

        if (geom instanceof LineString) {
            return (LineString) geom;
        } else if (geom instanceof MultiLineString) {

            Geometry merged = geom.union();

            if (merged instanceof LineString) {
                return (LineString) merged;
                
            } else {
                throw new RuntimeException("No se pudo convertir MultiLineString a LineString");
            }
        } else {
            throw new RuntimeException("Tipo de geometría no compatible: " + geom.getGeometryType());
        }

        } catch (Exception e) {
            throw new RuntimeException("Error parsing WKT to LineString: " + e.getMessage(), e);
        }
    }
}

package com.example.tsigback.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class RoutingRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

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

    public String calculateRouteGeoJSON(List<Long> nodeIds) {
        StringBuilder viaNodes = new StringBuilder();
        for (Long id : nodeIds) {
            if (viaNodes.length() > 0) viaNodes.append(", ");
            viaNodes.append(id);
        }

        String sql =
            "SELECT ST_AsGeoJSON(ST_LineMerge(ST_Union(geom))) AS geojson " +
            "FROM ft_caminera_nacional_edges " +
            "WHERE id IN (" +
            "  SELECT edge " +
            "  FROM pgr_dijkstra( " +
            "    'SELECT id, source, target, cost, reverse_cost FROM ft_caminera_nacional_edges', " +
            "    ARRAY[" + viaNodes + "], " +
            "    directed := false " +
            "  )" +
            ")";

        return jdbcTemplate.queryForObject(sql, String.class);
    }
}
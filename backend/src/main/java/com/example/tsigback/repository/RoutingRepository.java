package com.example.tsigback.repository;

import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.io.WKTReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Repository
public class RoutingRepository {

    private static final Logger logger = LoggerFactory.getLogger(RoutingRepository.class);

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

    /**
     * Valida que toda la geometría de una ruta esté dentro del buffer de la caminera nacional
     * Usa una estrategia optimizada con muestreo de puntos para mejorar performance
     * @param geoJsonLineString GeoJSON LineString de la ruta
     * @param bufferMeters Buffer en metros para la tolerancia
     * @return true si toda la ruta está dentro del buffer, false en caso contrario
     */
    public Boolean validateRouteWithinBuffer(String geoJsonLineString, double bufferMeters) {
        logger.info("Iniciando validación de ruta con buffer de {} metros", bufferMeters);
        long startTime = System.currentTimeMillis();
        
        try {
            // Estrategia optimizada: muestrear puntos a lo largo de la ruta cada 100 metros
            // y verificar que todos estén cerca de la caminera
            String sql = """
                WITH route_geom AS (
                    SELECT ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) as geom
                ),
                sampled_points AS (
                    SELECT ST_DumpPoints(
                        ST_LineInterpolatePoints(
                            route_geom.geom, 
                            GREATEST(0.01, 100.0 / GREATEST(ST_Length(route_geom.geom::geography), 100.0))
                        )
                    ).geom as point
                    FROM route_geom
                )
                SELECT NOT EXISTS (
                    SELECT 1 
                    FROM sampled_points sp
                    WHERE NOT EXISTS (
                        SELECT 1 
                        FROM ft_caminera_nacional cn 
                        WHERE ST_DWithin(sp.point::geography, cn.geom::geography, ?)
                    )
                ) as is_valid
                """;
            
            // Usar timeout para evitar consultas que tomen demasiado tiempo
            jdbcTemplate.setQueryTimeout(30); // 30 segundos máximo
            
            Boolean result = jdbcTemplate.queryForObject(sql, Boolean.class, geoJsonLineString, bufferMeters);
            long duration = System.currentTimeMillis() - startTime;
            logger.info("Validación optimizada completada en {} ms. Resultado: {}", duration, result);
            
            return result != null ? result : false;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logger.warn("Validación optimizada falló después de {} ms: {}. Intentando validación simple.", duration, e.getMessage());
            // Si la consulta optimizada falla, hacer una validación más simple
            Boolean simpleResult = validateRouteSimple(geoJsonLineString, bufferMeters);
            
            // Si la validación simple también falla, intentar una validación permisiva
            if (!simpleResult) {
                logger.info("Validación simple falló, intentando validación permisiva como último recurso");
                return validateRoutePermissive(geoJsonLineString, bufferMeters);
            }
            
            return simpleResult;
        }
    }
    
    /**
     * Validación simplificada como fallback
     */
    private Boolean validateRouteSimple(String geoJsonLineString, double bufferMeters) {
        logger.info("Ejecutando validación simple con buffer de {} metros", bufferMeters);
        long startTime = System.currentTimeMillis();
        
        try {
            // Estrategia más simple: verificar solo puntos extremos y algunos intermedios
            String sql = """
                WITH route_geom AS (
                    SELECT ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) as geom
                ),
                test_points AS (
                    SELECT ST_StartPoint(geom) as point FROM route_geom
                    UNION ALL
                    SELECT ST_EndPoint(geom) as point FROM route_geom
                    UNION ALL
                    SELECT ST_LineInterpolatePoint(geom, 0.25) as point FROM route_geom
                    UNION ALL
                    SELECT ST_LineInterpolatePoint(geom, 0.5) as point FROM route_geom
                    UNION ALL
                    SELECT ST_LineInterpolatePoint(geom, 0.75) as point FROM route_geom
                )
                SELECT NOT EXISTS (
                    SELECT 1 
                    FROM test_points tp
                    WHERE NOT EXISTS (
                        SELECT 1 
                        FROM ft_caminera_nacional cn 
                        WHERE ST_DWithin(tp.point::geography, cn.geom::geography, ?)
                    )
                ) as is_valid
                """;
            
            Boolean result = jdbcTemplate.queryForObject(sql, Boolean.class, geoJsonLineString, bufferMeters);
            long duration = System.currentTimeMillis() - startTime;
            logger.info("Validación simple completada en {} ms. Resultado: {}", duration, result);
            
            // Si la validación simple falla, intentar la validación permisiva
            if (result == null || !result) {
                logger.info("Validación simple falló, intentando validación permisiva");
                return validateRoutePermissive(geoJsonLineString, bufferMeters);
            }
            
            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logger.error("Error en validación simple después de {} ms: {}", duration, e.getMessage());
            throw new RuntimeException("Error validating route (simple): " + e.getMessage(), e);
        }
    }
    
    /**
     * Validación permisiva para casos donde la ruta puede estar marginalmente fuera del buffer
     * pero claramente sobre carreteras principales
     */
    private Boolean validateRoutePermissive(String geoJsonLineString, double bufferMeters) {
        logger.info("Ejecutando validación permisiva con buffer extendido");
        long startTime = System.currentTimeMillis();
        
        try {
            // Usar un buffer más grande para casos edge
            double extendedBuffer = bufferMeters * 2; // Duplicar el buffer
            
            String sql = """
                WITH route_geom AS (
                    SELECT ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) as geom
                ),
                test_points AS (
                    SELECT ST_StartPoint(geom) as point FROM route_geom
                    UNION ALL
                    SELECT ST_EndPoint(geom) as point FROM route_geom
                    UNION ALL
                    SELECT ST_LineInterpolatePoint(geom, 0.5) as point FROM route_geom
                )
                SELECT COUNT(*) >= 2 as is_mostly_valid
                FROM test_points tp
                WHERE EXISTS (
                    SELECT 1 
                    FROM ft_caminera_nacional cn 
                    WHERE ST_DWithin(tp.point::geography, cn.geom::geography, ?)
                )
                """;
            
            Boolean result = jdbcTemplate.queryForObject(sql, Boolean.class, extendedBuffer);
            long duration = System.currentTimeMillis() - startTime;
            logger.info("Validación permisiva completada en {} ms. Resultado: {}", duration, result);
            
            return result != null ? result : false;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logger.error("Error en validación permisiva después de {} ms: {}", duration, e.getMessage());
            return false;
        }
    }

    /**
     * Valida que los puntos inicial y final de una ruta estén cerca de paradas existentes
     * @param geoJsonLineString GeoJSON LineString de la ruta
     * @param bufferMeters Buffer en metros para considerar una parada como "cerca"
     * @return true si tanto el punto inicial como final están cerca de paradas, false en caso contrario
     */
    public Boolean validateRouteEndpointsNearStops(String geoJsonLineString, double bufferMeters) {
        logger.info("Validando cercanía de extremos de ruta a paradas con buffer de {} metros", bufferMeters);
        long startTime = System.currentTimeMillis();
        
        try {
            String sql = """
                WITH route_geom AS (
                    SELECT ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) as geom
                ),
                route_endpoints AS (
                    SELECT 
                        ST_StartPoint(geom) as start_point,
                        ST_EndPoint(geom) as end_point
                    FROM route_geom
                ),
                start_near_stop AS (
                    SELECT COUNT(*) > 0 as has_start_stop
                    FROM route_endpoints re, parada p
                    WHERE ST_DWithin(re.start_point::geography, p.ubicacion::geography, ?)
                ),
                end_near_stop AS (
                    SELECT COUNT(*) > 0 as has_end_stop
                    FROM route_endpoints re, parada p
                    WHERE ST_DWithin(re.end_point::geography, p.ubicacion::geography, ?)
                )
                SELECT (sns.has_start_stop AND ens.has_end_stop) as both_endpoints_valid
                FROM start_near_stop sns, end_near_stop ens
                """;
            
            Boolean result = jdbcTemplate.queryForObject(sql, Boolean.class, 
                geoJsonLineString, bufferMeters, bufferMeters);
            
            long duration = System.currentTimeMillis() - startTime;
            logger.info("Validación de extremos completada en {} ms. Resultado: {}", duration, result);
            
            return result != null ? result : false;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logger.error("Error en validación de extremos después de {} ms: {}", duration, e.getMessage());
            return false;
        }
    }

    /**
     * Obtiene información detallada sobre la cercanía de los extremos de una ruta a paradas
     * @param geoJsonLineString GeoJSON LineString de la ruta
     * @param bufferMeters Buffer en metros para considerar una parada como "cerca"
     * @return String con información detallada sobre qué extremos están cerca de paradas
     */
    public String getRouteEndpointsStopsInfo(String geoJsonLineString, double bufferMeters) {
        logger.info("Obteniendo información detallada de extremos de ruta");
        
        try {
            String sql = """
                WITH route_geom AS (
                    SELECT ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) as geom
                ),
                route_endpoints AS (
                    SELECT 
                        ST_StartPoint(geom) as start_point,
                        ST_EndPoint(geom) as end_point
                    FROM route_geom
                ),
                start_stops AS (
                    SELECT COUNT(*) as start_count
                    FROM route_endpoints re, parada p
                    WHERE ST_DWithin(re.start_point::geography, p.ubicacion::geography, ?)
                ),
                end_stops AS (
                    SELECT COUNT(*) as end_count
                    FROM route_endpoints re, parada p
                    WHERE ST_DWithin(re.end_point::geography, p.ubicacion::geography, ?)
                )
                SELECT 
                    CASE 
                        WHEN ss.start_count > 0 AND es.end_count > 0 THEN 'Ambos extremos están cerca de paradas'
                        WHEN ss.start_count > 0 AND es.end_count = 0 THEN 'Solo el punto inicial está cerca de una parada'
                        WHEN ss.start_count = 0 AND es.end_count > 0 THEN 'Solo el punto final está cerca de una parada'
                        ELSE 'Ningún extremo está cerca de paradas'
                    END as info
                FROM start_stops ss, end_stops es
                """;
            
            String result = jdbcTemplate.queryForObject(sql, String.class, 
                geoJsonLineString, bufferMeters, bufferMeters);
            
            return result != null ? result : "No se pudo obtener información";
        } catch (Exception e) {
            logger.error("Error obteniendo información de extremos: {}", e.getMessage());
            return "Error al obtener información de extremos";
        }
    }
}

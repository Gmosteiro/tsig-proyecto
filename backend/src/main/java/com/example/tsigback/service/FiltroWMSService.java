package com.example.tsigback.service;

import com.example.tsigback.entities.dtos.CriteriosFiltroDTO;
import com.example.tsigback.entities.dtos.FiltroWMSDTO;
import com.example.tsigback.entities.dtos.LineaDTO;
import com.example.tsigback.entities.Linea;
import com.example.tsigback.repository.LineaRepository;
import com.example.tsigback.repository.ParadaLineaRepository;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.locationtech.jts.io.geojson.GeoJsonWriter;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para generar filtros CQL para WMS basados en criterios de búsqueda
 */
@Slf4j
@Service
public class FiltroWMSService {

    @Autowired
    private LineaService lineaService;
    
    @Autowired
    private LineaRepository lineaRepository;
    
    @Autowired
    private ParadaLineaRepository paradaLineaRepository;

    /**
     * Genera los filtros CQL para aplicar en WMS basados en los criterios especificados
     */
    public FiltroWMSDTO generarFiltrosWMS(CriteriosFiltroDTO criterios) {
        try {
            log.info("Generando filtros WMS para criterios: {}", criterios);
            
            // Obtener las líneas que cumplen los criterios
            List<LineaDTO> lineasFiltradas = obtenerLineasFiltradas(criterios);
            
            if (lineasFiltradas.isEmpty()) {
                log.info("No se encontraron líneas que cumplan los criterios");
                return FiltroWMSDTO.builder()
                        .filtroLineas("id = -1") // Filtro que no mostrará nada
                        .filtroParadas("id = -1") // Filtro que no mostrará nada
                        .tieneResultados(false)
                        .totalLineas(0)
                        .totalParadas(0)
                        .build();
            }

            // Extraer los IDs de las líneas filtradas
            List<Integer> idsLineas = lineasFiltradas.stream()
                    .map(LineaDTO::getId)
                    .collect(Collectors.toList());

            // Obtener los IDs de las paradas asociadas a estas líneas
            List<Integer> idsParadas = obtenerIdsParadasDeLineas(idsLineas);

            // Generar filtros CQL
            String filtroLineas = generarFiltroCQLLineas(idsLineas);
            String filtroParadas = generarFiltroCQLParadas(idsParadas);

            FiltroWMSDTO resultado = FiltroWMSDTO.builder()
                    .filtroLineas(filtroLineas)
                    .filtroParadas(filtroParadas)
                    .tieneResultados(true)
                    .totalLineas(idsLineas.size())
                    .totalParadas(idsParadas.size())
                    .build();

            log.info("Filtros WMS generados: {} líneas, {} paradas", 
                    idsLineas.size(), idsParadas.size());
            
            return resultado;
            
        } catch (Exception e) {
            log.error("Error al generar filtros WMS: {}", e.getMessage(), e);
            // En caso de error, devolver filtros que no muestren nada
            return FiltroWMSDTO.builder()
                    .filtroLineas("id = -1")
                    .filtroParadas("id = -1")
                    .tieneResultados(false)
                    .totalLineas(0)
                    .totalParadas(0)
                    .build();
        }
    }

    /**
     * Obtiene las líneas que cumplen los criterios especificados
     */
    private List<LineaDTO> obtenerLineasFiltradas(CriteriosFiltroDTO criterios) throws Exception {
        List<LineaDTO> lineas = new ArrayList<>();

        // Aplicar filtros según los criterios especificados
        if (criterios.getIdsLineas() != null && !criterios.getIdsLineas().isEmpty()) {
            // Filtro por IDs específicos de líneas
            for (Integer id : criterios.getIdsLineas()) {
                try {
                    LineaDTO linea = lineaService.obtenerLineaPorId(id);
                    if (linea != null) {
                        lineas.add(linea);
                    }
                } catch (Exception e) {
                    log.warn("No se pudo obtener línea con ID {}: {}", id, e.getMessage());
                }
            }
        } else if (criterios.getEmpresa() != null && !criterios.getEmpresa().trim().isEmpty()) {
            // Filtro por empresa
            lineas = lineaService.obtenerLineasPorEmpresa(criterios.getEmpresa().trim());
        } else if (criterios.getIdDepartamentoOrigen() != null && criterios.getIdDepartamentoDestino() != null) {
            // Filtro por origen y destino
            lineas = lineaService.obtenerLineasPorOrigenDestino(
                    criterios.getIdDepartamentoOrigen(), 
                    criterios.getIdDepartamentoDestino());
        } else if (criterios.getRuta() != null && criterios.getKilometro() != null) {
            // Filtro por ruta y kilómetro
            lineas = lineaService.obtenerLineasPorRutaKilometro(
                    criterios.getRuta(), 
                    criterios.getKilometro());
        } else if (criterios.getPoligonoGeoJSON() != null && !criterios.getPoligonoGeoJSON().trim().isEmpty()) {
            // Filtro por intersección con polígono
            lineas = lineaService.obtenerLineasPorInterseccionPoligono(criterios.getPoligonoGeoJSON());
        } else if (criterios.getIdParadaCercana() != null) {
            // Filtro por parada cercana (usar distancia por defecto de 100 metros)
            lineas = lineaService.obtenerLineasCercanasAParada(criterios.getIdParadaCercana(), 100.0);
        } else {
            // Si no hay criterios específicos, necesitamos obtener todas las líneas
            // Como no existe obtenerTodasLasLineas(), usaremos el repositorio directamente
            lineas = lineaRepository.findAll().stream()
                    .map(this::toLineaDTO)
                    .collect(Collectors.toList());
        }

        // Aplicar filtro adicional por estado habilitado si se especifica
        if (criterios.getEstaHabilitada() != null) {
            lineas = lineas.stream()
                    .filter(linea -> linea.isEstaHabilitada() == criterios.getEstaHabilitada())
                    .collect(Collectors.toList());
        }

        return lineas;
    }

    /**
     * Obtiene los IDs de las paradas asociadas a las líneas especificadas
     */
    private List<Integer> obtenerIdsParadasDeLineas(List<Integer> idsLineas) {
        List<Integer> idsParadas = new ArrayList<>();
        
        for (Integer idLinea : idsLineas) {
            try {
                // Obtener paradas asociadas a esta línea que estén habilitadas
                List<Integer> paradasDeLinea = paradaLineaRepository.findByLineaId(idLinea)
                        .stream()
                        .filter(pl -> pl.isEstaHabilitada())
                        .map(pl -> pl.getParada().getId())
                        .collect(Collectors.toList());
                
                idsParadas.addAll(paradasDeLinea);
            } catch (Exception e) {
                log.warn("Error al obtener paradas de línea {}: {}", idLinea, e.getMessage());
            }
        }
        
        // Eliminar duplicados
        return idsParadas.stream().distinct().collect(Collectors.toList());
    }

    /**
     * Genera el filtro CQL para las líneas
     */
    private String generarFiltroCQLLineas(List<Integer> idsLineas) {
        if (idsLineas.isEmpty()) {
            return "id = -1"; // No mostrar nada
        }
        
        // Construir filtro tipo: id IN (1, 2, 3, 4)
        String ids = idsLineas.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(", "));
        
        return "id IN (" + ids + ")";
    }

    /**
     * Genera el filtro CQL para las paradas
     */
    private String generarFiltroCQLParadas(List<Integer> idsParadas) {
        if (idsParadas.isEmpty()) {
            return "id = -1"; // No mostrar nada
        }
        
        // Construir filtro tipo: id IN (1, 2, 3, 4)
        String ids = idsParadas.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(", "));
        
        return "id IN (" + ids + ")";
    }

    /**
     * Genera filtros CQL para limpiar (mostrar todo)
     */
    public FiltroWMSDTO generarFiltrosLimpios() {
        log.info("Generando filtros limpios (mostrar todo)");
        
        return FiltroWMSDTO.builder()
                .filtroLineas("1=1") // Mostrar todas las líneas
                .filtroParadas("1=1") // Mostrar todas las paradas
                .tieneResultados(true)
                .totalLineas(-1) // Indicador de "todas"
                .totalParadas(-1) // Indicador de "todas"
                .build();
    }

    /**
     * Convierte una entidad Linea a LineaDTO (versión simplificada)
     */
    private LineaDTO toLineaDTO(Linea linea) {
        GeoJsonWriter writer = new GeoJsonWriter();
        
        return LineaDTO.builder()
                .id(linea.getId())
                .descripcion(linea.getDescripcion())
                .empresa(linea.getEmpresa())
                .origen(linea.getOrigen())
                .destino(linea.getDestino())
                .observacion(linea.getObservacion())
                .estaHabilitada(linea.isEstaHabilitada())
                .rutaGeoJSON(writer.write(linea.getRecorrido()))
                .build();
    }
}

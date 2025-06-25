package com.example.tsigback.service;

import com.example.tsigback.entities.Linea;
import com.example.tsigback.entities.Parada;
import com.example.tsigback.entities.ParadaLinea;
import com.example.tsigback.entities.HorarioParadaLinea;
import com.example.tsigback.entities.dtos.LineaDTO;
import com.example.tsigback.entities.dtos.PuntoDTO;
import com.example.tsigback.entities.dtos.ParadaLineaDTO;
import com.example.tsigback.entities.dtos.HorarioDTO;
import com.example.tsigback.entities.enums.EstadoParada;
import com.example.tsigback.exception.LineaNoEncontradaException;
import com.example.tsigback.exception.ParadaNoEncontradaException;
import com.example.tsigback.repository.LineaRepository;
import com.example.tsigback.repository.ParadaRepository;
import com.example.tsigback.repository.RoutingRepository;
import com.example.tsigback.repository.ParadaLineaRepository;
import com.example.tsigback.repository.HorarioParadaLineaRepository;
import com.example.tsigback.utils.GeoUtils;

import lombok.extern.slf4j.Slf4j;

import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.geom.MultiPoint;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.io.geojson.GeoJsonWriter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class LineaService {

    @Autowired
    private LineaRepository lineaRepository;

    @Autowired
    private ParadaRepository paradaRepository;

    @Autowired
    private RoutingRepository routingRepository;

    @Autowired
    private ParadaLineaRepository paradaLineaRepository;

    @Autowired
    private HorarioParadaLineaRepository horarioParadaLineaRepository;

    private static final double MAX_DIST = 100.0; // metros

    public void crearLinea(LineaDTO linea) {
        try {
            validateGeoJson(linea.getRutaGeoJSON());
            MultiLineString recorrido = GeoUtils.geoJsonToMultiLineString(linea.getRutaGeoJSON());
            MultiPoint puntos = GeoUtils.crearMultiPointDesdeDTOs(linea.getPuntos());
            Point puntoOrigen = getPuntoDeOrigen(linea.getPuntos());
            Point puntoDestino = getPuntoDestino(linea.getPuntos());
            String origen = lineaRepository.obtenerDepartamentoOrigen(puntoOrigen);
            String destino = lineaRepository.obtenerDepartamentoDestino(puntoDestino);

            if (!paradaRepository.existeParadaCercaDePunto(puntoOrigen, 50.0) ||
                !paradaRepository.existeParadaCercaDePunto(puntoDestino, 50.0)) {
                throw new IllegalArgumentException("El origen y/o destino no están a menos de 50 metros de una parada.");
            }

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
                throw new IllegalArgumentException("No se pudo calcular la distancia para el punto (" + pt.getLatitud()
                        + ", " + pt.getLongitud() + ").");
            }
            if (dist > MAX_DIST) {
                throw new IllegalArgumentException("El punto (" + pt.getLatitud() + ", " + pt.getLongitud()
                        + ") está a más de 100 metros de la red.");
            }
        }
    }

    public List<LineaDTO> obtenerLineasPorOrigenDestino(int idDepartamentoOrigen, int idDepartamentoDestino)
            throws LineaNoEncontradaException {
        List<Linea> lineas = lineaRepository.findByOrigenAndDestino(idDepartamentoOrigen, idDepartamentoDestino);
        if (lineas.isEmpty()) {
            throw new LineaNoEncontradaException("No se encontraron líneas para el origen y destino especificados.");
        }
        return lineas.stream().map(this::toSimpleDTO).collect(Collectors.toList());
    }

    public List<LineaDTO> obtenerLineasPorRutaKilometro(int ruta, int kilometro) throws LineaNoEncontradaException {
        List<Linea> lineas = lineaRepository.findByRutaAndKilometro(ruta, kilometro);
        if (lineas.isEmpty()) {
            throw new LineaNoEncontradaException("No se encontraron líneas para la ruta y kilómetros especificados.");
        }
        return lineas.stream().map(this::toSimpleDTO).collect(Collectors.toList());
    }

    public List<LineaDTO> obtenerLineasPorInterseccionPoligono(String geoJsonPoligono) {
        try {
            List<Linea> intersectan = lineaRepository.findByRecorridoIntersectaPoligono(geoJsonPoligono);
            return intersectan.stream().map(this::toSimpleDTO).collect(Collectors.toList());
        } catch (Exception e) {
            throw new IllegalArgumentException("No se pudo procesar el polígono GeoJSON: " + e.getMessage(), e);
        }
    }

    public List<LineaDTO> obtenerLineasPorEmpresa(String empresa) {
        List<Linea> lineas = lineaRepository.findByEmpresaNombre(empresa);
        return lineas.stream().map(this::toSimpleDTO).collect(Collectors.toList());
    }

    public LineaDTO obtenerLineaPorId(int id) {
        return lineaRepository.findById(id)
                .map(this::toDTO)
                .orElse(null);
    }

    private LineaDTO toDTO(Linea linea) {
        if (linea == null)
            return null;

        // Convertir MultiPoint a lista de PuntoDTO
        List<PuntoDTO> listaPuntos = null;
        if (linea.getPuntos() != null) {
            listaPuntos = new ArrayList<>();
            for (int i = 0; i < linea.getPuntos().getNumGeometries(); i++) {
                var p = (org.locationtech.jts.geom.Point) linea.getPuntos().getGeometryN(i);
                listaPuntos.add(PuntoDTO.builder()
                        .longitud(p.getX())
                        .latitud(p.getY())
                        .build());
            }
        }

        // Convertir MultiLineString a GeoJSON
        String rutaGeoJSON = null;
        if (linea.getRecorrido() != null) {
            GeoJsonWriter writer = new GeoJsonWriter();
            rutaGeoJSON = writer.write(linea.getRecorrido());
        }

        // Convertir MultiLineString a WKT
        String recorridoWKT = (linea.getRecorrido() != null) ? linea.getRecorrido().toText() : null;

        // Obtener IDs de ParadaLinea
        List<Integer> paradaLineaIds = null;
        if (linea.getParadasLineas() != null) {
            paradaLineaIds = linea.getParadasLineas().stream()
                    .map(ParadaLinea::getId)
                    .toList();
        }

        return LineaDTO.builder()
                .id(linea.getId())
                .descripcion(linea.getDescripcion())
                .empresa(linea.getEmpresa())
                .observacion(linea.getObservacion())
                .origen(linea.getOrigen())
                .destino(linea.getDestino())
                .estaHabilitada(linea.isEstaHabilitada())
                .puntos(listaPuntos)
                .rutaGeoJSON(rutaGeoJSON)
                .recorrido(recorridoWKT)
                .paradaLineaIds(paradaLineaIds)
                .build();
    }

    private LineaDTO toSimpleDTO(Linea linea) {
        if (linea == null)
            return null;

        // Obtener IDs de ParadaLinea
        List<Integer> paradaLineaIds = null;
        if (linea.getParadasLineas() != null) {
            paradaLineaIds = linea.getParadasLineas().stream()
                    .map(ParadaLinea::getId)
                    .toList();
        }

        return LineaDTO.builder()
                .id(linea.getId())
                .descripcion(linea.getDescripcion())
                .empresa(linea.getEmpresa())
                .observacion(linea.getObservacion())
                .origen(linea.getOrigen())
                .destino(linea.getDestino())
                .estaHabilitada(linea.isEstaHabilitada())
                .paradaLineaIds(paradaLineaIds)
                // No incluye puntos, rutaGeoJSON ni recorrido
                .build();
    }

    /**
     * Calcula si una línea debe estar habilitada basado en:
     * 1. Si la línea está marcada como habilitada
     * 2. Si tiene paradas asociadas habilitadas
     * 3. Si tiene al menos una asociación parada-línea habilitada
     */
    private boolean calcularEstadoLinea(Linea linea) {
        // Si la línea está marcada como deshabilitada, no importa el resto
        if (!linea.isEstaHabilitada()) {
            return false;
        }

        // Si no tiene paradas asociadas, está deshabilitada
        if (linea.getParadasLineas() == null || linea.getParadasLineas().isEmpty()) {
            return false;
        }

        // Verificar si tiene al menos una parada habilitada con asociación habilitada
        boolean tieneParadaHabilitada = linea.getParadasLineas().stream()
                .anyMatch(pl -> pl.isEstaHabilitada() && 
                              pl.getParada().getEstado() == EstadoParada.HABILITADA);

        return tieneParadaHabilitada;
    }

    public List<LineaDTO> obtenerLineasActivasEnRango(LocalTime horaDesde, LocalTime horaHasta) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss");
        List<Linea> lineas = lineaRepository.findLineasActivasEnRango(
                horaDesde.format(formatter),
                horaHasta.format(formatter));
        return lineas.stream().map(this::toSimpleDTO).collect(Collectors.toList());
    }

    public void modificarLinea(LineaDTO lineaDTO) throws LineaNoEncontradaException {
        Linea linea = lineaRepository.findById(Math.toIntExact(lineaDTO.getId()))
                .orElseThrow(() -> new LineaNoEncontradaException(
                        "La linea con id " + lineaDTO.getId() + " no ha sido encontrada"));

        // Actualizar campos básicos
        linea.setDescripcion(lineaDTO.getDescripcion() != null ? lineaDTO.getDescripcion() : linea.getDescripcion());
        linea.setEmpresa(lineaDTO.getEmpresa() != null ? lineaDTO.getEmpresa() : linea.getEmpresa());
        linea.setObservacion(lineaDTO.getObservacion() != null ? lineaDTO.getObservacion() : linea.getObservacion());

        List<PuntoDTO> puntosDtos = lineaDTO.getPuntos();

        if (puntosDtos != null && puntosDtos.size() > 1) {
            // Validar que el GeoJSON esté presente
            if (lineaDTO.getRutaGeoJSON() != null && !lineaDTO.getRutaGeoJSON().trim().isEmpty()) {
                MultiLineString nuevoRecorrido = GeoUtils.geoJsonToMultiLineString(lineaDTO.getRutaGeoJSON());
                MultiPoint nuevosPuntos = GeoUtils.crearMultiPointDesdeDTOs(puntosDtos);

                // Procesar paradas existentes antes de actualizar el recorrido
                List<ParadaLinea> paradasExistentes = new ArrayList<>(linea.getParadasLineas());
                for (ParadaLinea paradaLinea : paradasExistentes) {
                    procesamientoDeParadaLinea(paradaLinea, linea, nuevoRecorrido);
                }

                // Actualizar geometrías
                linea.setRecorrido(nuevoRecorrido);
                linea.setPuntos(nuevosPuntos);

                // Actualizar origen y destino
                String origen = lineaRepository.obtenerDepartamentoOrigen(getPuntoDeOrigen(puntosDtos));
                String destino = lineaRepository.obtenerDepartamentoDestino(getPuntoDestino(puntosDtos));
                linea.setOrigen(origen);
                linea.setDestino(destino);

                // Recalcular el estado de la línea después de modificar el recorrido
                linea.setEstaHabilitada(calcularEstadoLinea(linea));
            }
        }

        lineaRepository.save(linea);
    }

    private void procesamientoDeParadaLinea(ParadaLinea paradaLinea, Linea linea, MultiLineString nuevoRecorrido) {
        Parada parada = paradaLinea.getParada();

        // Verificar si la parada está cerca del nuevo recorrido (menos de 100 metros)
        if (!lineaRepository.esNuevaParadaCercaDeParada(nuevoRecorrido, parada.getUbicacion(), 100.0)) {
            // La parada queda huérfana del nuevo recorrido, deshabilitar la asociación
            paradaLinea.setEstaHabilitada(false);
            
            // Verificar si esta parada tiene otras líneas habilitadas
            List<ParadaLinea> otrasLineasHabilitadas = paradaLineaRepository.findByParadaId(parada.getId())
                .stream()
                .filter(pl -> pl.getId() != paradaLinea.getId() && pl.isEstaHabilitada())
                .toList();
            
            // Si no tiene otras líneas habilitadas, deshabilitar la parada completa
            if (otrasLineasHabilitadas.isEmpty()) {
                parada.setEstado(EstadoParada.DESHABILITADA);
                paradaRepository.save(parada);
            }
            
            // Guardar la paradaLinea deshabilitada
            paradaLineaRepository.save(paradaLinea);
        }
    }

    private void validateGeoJson(String rutaGeoJSON) {
        if (rutaGeoJSON == null || rutaGeoJSON.trim().isEmpty() || rutaGeoJSON.equals("null")) {
            throw new IllegalArgumentException("El campo rutaGeoJSON no puede ser nulo, vacío ni 'null'.");
        }
    }

    private boolean estaAsociadoUnicamenteAEstaLinea(Parada paradaAsociada) {
        // Me fijo las lineas que estan habilitadas
        return paradaAsociada
                .getLineas()
                .stream()
                .filter(paradaLinea -> paradaLinea.isEstaHabilitada())
                .count() == 1;
    }

    public List<LineaDTO> buscarLineaPorDestino(String destino) {
        return lineaRepository.findByDestino(destino).stream().map(linea -> toDTO(linea)).collect(Collectors.toList());
    }

    public List<LineaDTO> obtenerTodas() {
        return lineaRepository.findAll()
                .stream().map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<LineaDTO> obtenerTodasSinRecorrido() {
        return lineaRepository.findAll()
                .stream().map(this::toSimpleDTO)
                .collect(Collectors.toList());
    }

    public void eliminarLineaYRelaciones(int id) throws LineaNoEncontradaException {
        Linea linea = lineaRepository.findById(id)
                .orElseThrow(() -> new LineaNoEncontradaException("La línea con id " + id + " no ha sido encontrada"));

        // Obtener todas las asociaciones parada-línea antes de eliminar la línea
        List<ParadaLinea> paradasLineas = new ArrayList<>(linea.getParadasLineas());
        
        // Procesar cada parada asociada para verificar si debe ser deshabilitada
        for (ParadaLinea paradaLinea : paradasLineas) {
            Parada parada = paradaLinea.getParada();
            
            // Verificar si esta parada tiene otras líneas habilitadas (excluyendo la que se va a eliminar)
            List<ParadaLinea> otrasLineasHabilitadas = paradaLineaRepository.findByParadaId(parada.getId())
                .stream()
                .filter(pl -> pl.getLinea().getId() != linea.getId() && pl.isEstaHabilitada())
                .toList();
            
            // Si no tiene otras líneas habilitadas, deshabilitar la parada
            if (otrasLineasHabilitadas.isEmpty()) {
                parada.setEstado(EstadoParada.DESHABILITADA);
                paradaRepository.save(parada);
            }
        }
        
        // Eliminar la línea (las asociaciones se eliminan en cascada)
        lineaRepository.delete(linea);
    }

    /**
     * Obtiene las líneas que están dentro de una distancia específica de una parada
     * @param paradaId ID de la parada de referencia
     * @param distanciaMetros Distancia máxima en metros
     * @return Lista de líneas cercanas a la parada
     * @throws ParadaNoEncontradaException Si la parada no existe
     */
    public List<LineaDTO> obtenerLineasCercanasAParada(int paradaId, double distanciaMetros) throws ParadaNoEncontradaException {
        // Verificar que la parada existe
        Parada parada = paradaRepository.findById(paradaId)
                .orElseThrow(() -> new ParadaNoEncontradaException("Parada con id " + paradaId + " no encontrada"));
        
        // Obtener todas las líneas
        List<Linea> todasLasLineas = lineaRepository.findAll();
        
        // Filtrar líneas que estén dentro de la distancia especificada
        List<Linea> lineasCercanas = todasLasLineas.stream()
                .filter(linea -> {
                    // Usar el método del repositorio para verificar si la parada está cerca del recorrido
                    return lineaRepository.esParadaCercaDelRecorrido(parada.getUbicacion(), linea.getId(), distanciaMetros);
                })
                .toList();
        
        // Convertir a DTO y retornar
        return lineasCercanas.stream()
                .map(this::toSimpleDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todas las paradas asociadas a una línea con sus horarios
     * Ordenadas por distancia desde el origen de la línea
     * @param lineaId ID de la línea
     * @return Lista de paradas con horarios ordenadas por posición en la ruta
     * @throws LineaNoEncontradaException Si la línea no existe
     */
    public List<ParadaLineaDTO> obtenerParadasDeLineaConHorarios(int lineaId) throws LineaNoEncontradaException {
        // Verificar que la línea existe
        Linea linea = lineaRepository.findById(lineaId)
                .orElseThrow(() -> new LineaNoEncontradaException("Línea con id " + lineaId + " no encontrada"));
        
        // Obtener todas las asociaciones parada-línea para esta línea
        List<ParadaLinea> paradasLinea = paradaLineaRepository.findByLineaId(lineaId);
        
        // Convertir a DTO y calcular orden por distancia desde el origen
        return paradasLinea.stream()
                .map(this::paradaLineaToDTO)
                .sorted((pl1, pl2) -> {
                    // Ordenar por distancia desde el origen de la línea
                    // Se puede usar la latitud o un campo de orden si existe
                    // Por ahora ordenamos por ID de parada como aproximación
                    return Integer.compare(pl1.getIdParada(), pl2.getIdParada());
                })
                .collect(Collectors.toList());
    }

    /**
     * Convierte una entidad ParadaLinea a DTO incluyendo horarios
     */
    private ParadaLineaDTO paradaLineaToDTO(ParadaLinea paradaLinea) {
        ParadaLineaDTO dto = new ParadaLineaDTO();
        dto.setIdParadaLinea(paradaLinea.getId());
        dto.setIdLinea(paradaLinea.getLinea().getId());
        dto.setIdParada(paradaLinea.getParada().getId());
        dto.setEstaHabilitada(paradaLinea.isEstaHabilitada());
        
        // Agregar información de la parada
        dto.setNombreParada(paradaLinea.getParada().getNombre());
        dto.setLatitudParada(paradaLinea.getParada().getUbicacion().getY());
        dto.setLongitudParada(paradaLinea.getParada().getUbicacion().getX());
        
        // Obtener horarios
        List<HorarioParadaLinea> horariosEntity = horarioParadaLineaRepository.findByParadaLinea(paradaLinea);
        List<HorarioDTO> horarios = horariosEntity.stream()
                .map(h -> {
                    HorarioDTO horario = new HorarioDTO();
                    horario.setId(h.getId());
                    horario.setHora(h.getHorario());
                    return horario;
                })
                .collect(Collectors.toList());
        
        dto.setHorarios(horarios);
        
        return dto;
    }

    /**
     * Cambia el estado de una línea y gestiona automáticamente las asociaciones parada-línea
     * @param lineaId ID de la línea
     * @param habilitada Nuevo estado de la línea
     * @throws LineaNoEncontradaException Si la línea no existe
     */
    public void cambiarEstadoLinea(int lineaId, boolean habilitada) throws LineaNoEncontradaException {
        Linea linea = lineaRepository.findById(lineaId)
                .orElseThrow(() -> new LineaNoEncontradaException("Línea con id " + lineaId + " no encontrada"));
        
        linea.setEstaHabilitada(habilitada);
        lineaRepository.save(linea);
        
        // Obtener todas las asociaciones parada-línea para esta línea
        List<ParadaLinea> paradasLinea = paradaLineaRepository.findByLineaId(lineaId);
        
        if (!habilitada) {
            // Si se deshabilita la línea, deshabilitar todas las asociaciones
            for (ParadaLinea paradaLinea : paradasLinea) {
                paradaLinea.setEstaHabilitada(false);
                paradaLineaRepository.save(paradaLinea);
            }
        } else {
            // Si se habilita la línea, habilitar solo las asociaciones que estén a menos de 100m
            for (ParadaLinea paradaLinea : paradasLinea) {
                // Verificar distancia antes de habilitar
                if (lineaRepository.esParadaCercaDelRecorrido(
                        paradaLinea.getParada().getUbicacion(), 
                        lineaId, 
                        100.0)) {
                    paradaLinea.setEstaHabilitada(true);
                    paradaLineaRepository.save(paradaLinea);
                }
            }
        }
        
        // Verificar el estado de todas las paradas afectadas
        for (ParadaLinea paradaLinea : paradasLinea) {
            verificarYActualizarEstadoParada(paradaLinea.getParada());
        }
    }

    /**
     * Verifica y actualiza el estado de una parada basado en sus líneas asociadas
     */
    private void verificarYActualizarEstadoParada(Parada parada) {
        List<ParadaLinea> lineasHabilitadas = paradaLineaRepository.findByParadaId(parada.getId())
                .stream()
                .filter(ParadaLinea::isEstaHabilitada)
                .toList();
        
        if (lineasHabilitadas.isEmpty()) {
            // Si no tiene líneas habilitadas, deshabilitar la parada
            parada.setEstado(EstadoParada.DESHABILITADA);
        } else {
            // Si tiene al menos una línea habilitada, habilitar la parada
            parada.setEstado(EstadoParada.HABILITADA);
        }
        
        paradaRepository.save(parada);
    }

}
package com.example.tsigback.service;

import com.example.tsigback.entities.Linea;
import com.example.tsigback.entities.Parada;
import com.example.tsigback.entities.ParadaLinea;
import com.example.tsigback.entities.HorarioParadaLinea;
import com.example.tsigback.entities.dtos.LineaDTO;
import com.example.tsigback.entities.dtos.PuntoDTO;
import com.example.tsigback.entities.dtos.ParadaLineaDTO;
import com.example.tsigback.entities.dtos.HorarioDTO;
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
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
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
    private static final double PARADA_ASOCIACION_DIST = 50.0; // metros para asociación automática

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

            Linea lineaGuardada = lineaRepository.save(nuevaLinea);
            
            // Crear asociaciones automáticas para origen y destino
            crearNuevasAsociacionesAutomaticas(lineaGuardada, puntoOrigen, puntoDestino);

            // Recalcular el estado de la línea después de las asociaciones
            lineaGuardada = lineaRepository.findById(lineaGuardada.getId()).orElse(lineaGuardada);
            lineaGuardada.setEstaHabilitada(calcularEstadoLinea(lineaGuardada));
            lineaRepository.save(lineaGuardada);
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
    }    /**
     * Asocia automáticamente las paradas de inicio y fin de una línea basándose en los puntos extremos
     * @param linea La línea a la que se asociarán las paradas
     * @param puntoOrigen Punto de origen de la línea
     * @param puntoDestino Punto de destino de la línea
     */
    /**
     * Busca una parada cercana a un punto
     * @param punto El punto de referencia
     * @param distancia La distancia máxima de búsqueda
     * @return La parada más cercana o null si no se encuentra ninguna
     */
    private Parada buscarParadaCercana(Point punto, double distancia) {
        return paradaRepository.findNearestParadaToPoint(punto, distancia);
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
     * Debe tener al menos dos asociaciones parada-línea habilitadas con paradas habilitadas
     */
    private boolean calcularEstadoLinea(Linea linea) {
        // Obtener las asociaciones parada-línea desde la base de datos para evitar problemas de lazy loading
        List<ParadaLinea> paradasLineas = paradaLineaRepository.findByLineaId(linea.getId());
        
        // Si no tiene paradas asociadas, está deshabilitada
        if (paradasLineas == null || paradasLineas.isEmpty()) {
            log.debug("Línea {} deshabilitada: no tiene paradas asociadas", linea.getId());
            return false;
        }

        // Contar asociaciones habilitadas con paradas habilitadas
        long count = paradasLineas.stream()
                .filter(pl -> {
                    boolean asociacionHabilitada = pl.isEstaHabilitada();
                    boolean paradaHabilitada = pl.getParada().isHabilitada();
                    log.debug("ParadaLinea {}: asociación habilitada={}, parada habilitada={}", 
                            pl.getId(), asociacionHabilitada, paradaHabilitada);
                    return asociacionHabilitada && paradaHabilitada;
                })
                .count();

        boolean resultado = count >= 2;
        log.info("Línea {}: {} asociaciones válidas encontradas, línea habilitada: {}", 
                linea.getId(), count, resultado);
        
        return resultado;
    }

    public List<LineaDTO> obtenerLineasActivasEnRango(LocalTime horaDesde, LocalTime horaHasta) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss");
        List<Linea> lineas = lineaRepository.findLineasActivasEnRango(
                horaDesde.format(formatter),
                horaHasta.format(formatter));
        return lineas.stream().map(this::toSimpleDTO).collect(Collectors.toList());
    }

    public void modificarLinea(LineaDTO lineaDTO) throws LineaNoEncontradaException {
        log.info("=== INICIO modificarLinea para línea ID: {} ===", lineaDTO.getId());
        
        Linea linea = lineaRepository.findById(Math.toIntExact(lineaDTO.getId()))
                .orElseThrow(() -> new LineaNoEncontradaException(
                        "La linea con id " + lineaDTO.getId() + " no ha sido encontrada"));

        boolean estadoActual = linea.isEstaHabilitada();
        boolean estadoSolicitado = lineaDTO.isEstaHabilitada();
        boolean cambioRecorrido = hayCambioDeRecorrido(lineaDTO);
        
        log.info("Estado actual: {}, Estado solicitado: {}, Cambio de recorrido: {}", 
                estadoActual, estadoSolicitado, cambioRecorrido);

        // 1. MANEJAR CAMBIO DE ESTADO DE HABILITACIÓN
        if (estadoActual != estadoSolicitado) {
            manejarCambioEstadoLinea(linea, estadoSolicitado);
        }

        // 2. ACTUALIZAR CAMPOS BÁSICOS
        actualizarCamposBasicos(linea, lineaDTO);

        // 3. MANEJAR CAMBIOS DE RECORRIDO/GEOMETRÍA
        if (cambioRecorrido) {
            manejarCambioRecorrido(linea, lineaDTO);
        } else {
            // Solo guardar cambios básicos si no hay cambio de recorrido
            lineaRepository.save(linea);
        }

        log.info("=== FIN modificarLinea para línea ID: {} ===", lineaDTO.getId());
    }

    /**
     * Maneja el cambio de estado de habilitación de una línea
     */
    private void manejarCambioEstadoLinea(Linea linea, boolean nuevoEstado) {
        log.info("Cambiando estado de línea {} de {} a {}", linea.getId(), linea.isEstaHabilitada(), nuevoEstado);
        
        List<ParadaLinea> asociaciones = paradaLineaRepository.findByLineaId(linea.getId());
        Set<Parada> paradasAfectadas = new HashSet<>();
        
        if (!nuevoEstado) {
            // CASO 1: Deshabilitar línea - Deshabilitar TODAS las asociaciones
            log.info("Deshabilitando {} asociaciones de la línea {}", asociaciones.size(), linea.getId());
            for (ParadaLinea asociacion : asociaciones) {
                asociacion.setEstaHabilitada(false);
                paradaLineaRepository.save(asociacion);
                paradasAfectadas.add(asociacion.getParada());
            }
            linea.setEstaHabilitada(false);
        } else {
            // CASO 2: Habilitar línea - Reactivar asociaciones que tengan sentido
            linea.setEstaHabilitada(true);
            log.info("Reactivando asociaciones válidas de la línea {}", linea.getId());
            for (ParadaLinea asociacion : asociaciones) {
                if (esAsociacionValida(asociacion, linea)) {
                    asociacion.setEstaHabilitada(true);
                    paradaLineaRepository.save(asociacion);
                    log.debug("Reactivada asociación parada {} - línea {}", 
                            asociacion.getParada().getId(), linea.getId());
                }
                paradasAfectadas.add(asociacion.getParada());
            }
        }
        
        // Actualizar el estado de todas las paradas afectadas
        actualizarEstadoParadas(new ArrayList<>(paradasAfectadas));
    }

    /**
     * Actualiza los campos básicos de la línea
     */
    private void actualizarCamposBasicos(Linea linea, LineaDTO lineaDTO) {
        if (lineaDTO.getDescripcion() != null) {
            linea.setDescripcion(lineaDTO.getDescripcion());
        }
        if (lineaDTO.getEmpresa() != null) {
            linea.setEmpresa(lineaDTO.getEmpresa());
        }
        if (lineaDTO.getObservacion() != null) {
            linea.setObservacion(lineaDTO.getObservacion());
        }
    }

    /**
     * Maneja los cambios de recorrido y geometría
     */
    private void manejarCambioRecorrido(Linea linea, LineaDTO lineaDTO) {
        log.info("Procesando cambio de recorrido para línea {}", linea.getId());
        
        List<PuntoDTO> puntosDtos = lineaDTO.getPuntos();
        MultiLineString nuevoRecorrido = GeoUtils.geoJsonToMultiLineString(lineaDTO.getRutaGeoJSON());
        MultiPoint nuevosPuntos = GeoUtils.crearMultiPointDesdeDTOs(puntosDtos);

        // Procesar asociaciones existentes según el nuevo recorrido
        procesarAsociacionesConNuevoRecorrido(linea, nuevoRecorrido);

        // Actualizar geometrías
        linea.setRecorrido(nuevoRecorrido);
        linea.setPuntos(nuevosPuntos);

        // Actualizar origen y destino
        Point nuevoOrigenPunto = getPuntoDeOrigen(puntosDtos);
        Point nuevoDestinoPunto = getPuntoDestino(puntosDtos);
        String origen = lineaRepository.obtenerDepartamentoOrigen(nuevoOrigenPunto);
        String destino = lineaRepository.obtenerDepartamentoDestino(nuevoDestinoPunto);
        linea.setOrigen(origen);
        linea.setDestino(destino);

        // Guardar la línea
        Linea lineaGuardada = lineaRepository.save(linea);

        // Crear nuevas asociaciones automáticas si es necesario
        crearNuevasAsociacionesAutomaticas(lineaGuardada, nuevoOrigenPunto, nuevoDestinoPunto);
    }

    /**
     * Procesa las asociaciones existentes con el nuevo recorrido
     */
    private void procesarAsociacionesConNuevoRecorrido(Linea linea, MultiLineString nuevoRecorrido) {
        List<ParadaLinea> asociacionesExistentes = paradaLineaRepository.findByLineaId(linea.getId());
        Set<Parada> paradasAfectadas = new HashSet<>();
        
        for (ParadaLinea asociacion : asociacionesExistentes) {
            boolean cercana = lineaRepository.esNuevaParadaCercaDeParada(
                    nuevoRecorrido, asociacion.getParada().getUbicacion(), 100.0);
            
            if (!cercana && asociacion.isEstaHabilitada()) {
                // La parada queda lejos del nuevo recorrido, deshabilitar solo si estaba habilitada
                log.debug("Deshabilitando asociación parada {} - línea {} (lejos del nuevo recorrido)", 
                        asociacion.getParada().getId(), linea.getId());
                asociacion.setEstaHabilitada(false);
                paradaLineaRepository.save(asociacion);
                paradasAfectadas.add(asociacion.getParada());
            }
            // Si está cerca, mantener el estado actual (no forzar habilitación)
        }
        
        // Actualizar el estado de las paradas afectadas
        if (!paradasAfectadas.isEmpty()) {
            actualizarEstadoParadas(new ArrayList<>(paradasAfectadas));
        }
    }

    /**
     * Crea nuevas asociaciones automáticas para origen y destino
     */
    private void crearNuevasAsociacionesAutomaticas(Linea linea, Point origen, Point destino) {
        // Solo crear nuevas asociaciones si la línea está habilitada
        if (!linea.isEstaHabilitada()) {
            log.info("Línea {} deshabilitada, creando asociaciones deshabilitadas", linea.getId());
        }

        // Buscar y asociar parada de origen
        Parada paradaOrigen = buscarParadaCercana(origen, PARADA_ASOCIACION_DIST);
        if (paradaOrigen != null) {
            crearOActualizarAsociacion(paradaOrigen, linea);
        }

        // Buscar y asociar parada de destino (evitar duplicados)
        Parada paradaDestino = buscarParadaCercana(destino, PARADA_ASOCIACION_DIST);
        if (paradaDestino != null && (paradaOrigen == null || paradaDestino.getId() != paradaOrigen.getId())) {
            crearOActualizarAsociacion(paradaDestino, linea);
        }
    }

    /**
     * Crea o actualiza una asociación parada-línea
     */
    private void crearOActualizarAsociacion(Parada parada, Linea linea) {
        ParadaLinea asociacionExistente = paradaLineaRepository.findByParadaIdAndLineaId(parada.getId(), linea.getId());

        if (asociacionExistente == null) {

            ParadaLinea nuevaAsociacion = ParadaLinea.builder()
                    .parada(parada)
                    .linea(linea)
                    .estaHabilitada(true)
                    .build();
            paradaLineaRepository.save(nuevaAsociacion);
            log.info("Nueva asociación creada: parada {} - línea {} (estado: habilitada)", 
                    parada.getId(), linea.getId());

            if (!parada.isHabilitada()) {
                parada.setHabilitada(true);
                paradaRepository.save(parada);
                log.info("Parada {} habilitada por nueva asociación habilitada", parada.getId());
            }
        }
    }

    /**
     * Verifica si una asociación es válida (parada cerca del recorrido)
     */
    private boolean esAsociacionValida(ParadaLinea asociacion, Linea linea) {
        return lineaRepository.esParadaCercaDelRecorrido(
                asociacion.getParada().getUbicacion(), 
                linea.getId(), 
                100.0);
    }

    /**
     * Verifica si hay cambios en el recorrido/geometría
     */
    private boolean hayCambioDeRecorrido(LineaDTO lineaDTO) {
        List<PuntoDTO> puntosDtos = lineaDTO.getPuntos();
        return puntosDtos != null && puntosDtos.size() > 1 && 
               lineaDTO.getRutaGeoJSON() != null && !lineaDTO.getRutaGeoJSON().trim().isEmpty();
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
                parada.setHabilitada(false);
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
                parada.setHabilitada(false);
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
        
        // Obtener todas las asociaciones parada-línea para esta línea ordenadas por posición en el recorrido
        List<ParadaLinea> paradasLinea = paradaLineaRepository.findByLineaIdOrderedByRecorrido(lineaId);
        
        // Convertir a DTO
        return paradasLinea.stream()
                .map(this::paradaLineaToDTO)
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
        log.info("Iniciando cambio de estado para línea {}: nuevo estado = {}", lineaId, habilitada);
        
        Linea linea = lineaRepository.findById(lineaId)
                .orElseThrow(() -> new LineaNoEncontradaException("Línea con id " + lineaId + " no encontrada"));
        
        log.info("Estado actual de la línea {}: {}", lineaId, linea.isEstaHabilitada());
        
        // Obtener todas las asociaciones parada-línea para esta línea
        List<ParadaLinea> paradasLinea = paradaLineaRepository.findByLineaId(lineaId);
        log.info("Encontradas {} asociaciones parada-línea para la línea {}", paradasLinea.size(), lineaId);
        
        if (!habilitada) {
            log.info("Deshabilitando línea {}: PRIMERO deshabilitando todas las asociaciones parada-línea", lineaId);
            // Si se deshabilita la línea, PRIMERO deshabilitar todas las asociaciones
            for (ParadaLinea paradaLinea : paradasLinea) {
                log.debug("Deshabilitando asociación parada-línea ID: {}", paradaLinea.getId());
                paradaLinea.setEstaHabilitada(false);
                paradaLineaRepository.save(paradaLinea);
            }
            
            // LUEGO deshabilitar la línea
            log.info("Deshabilitando la línea {} después de deshabilitar todas las asociaciones", lineaId);
            linea.setEstaHabilitada(false);
            lineaRepository.save(linea);
            log.info("Línea {} deshabilitada exitosamente", lineaId);
        } else {
            log.info("Habilitando línea {}: PRIMERO habilitando la línea", lineaId);
            // Si se habilita la línea, PRIMERO habilitar la línea
            linea.setEstaHabilitada(true);
            lineaRepository.save(linea);
            
            // LUEGO habilitar solo las asociaciones que estén a menos de 100m
            log.info("Habilitando asociaciones válidas para la línea {}", lineaId);
            for (ParadaLinea paradaLinea : paradasLinea) {
                // Verificar distancia antes de habilitar
                if (lineaRepository.esParadaCercaDelRecorrido(
                        paradaLinea.getParada().getUbicacion(), 
                        lineaId, 
                        100.0)) {
                    log.debug("Habilitando asociación parada-línea ID: {} (dentro de 100m)", paradaLinea.getId());
                    paradaLinea.setEstaHabilitada(true);
                    paradaLineaRepository.save(paradaLinea);
                } else {
                    log.debug("NO habilitando asociación parada-línea ID: {} (fuera de 100m)", paradaLinea.getId());
                }
            }
        }
        
        log.info("Cambio de estado completado para línea {}", lineaId);
    }

    /**
     * Actualiza el estado de una parada según sus asociaciones activas.
     * Una parada debe estar habilitada si tiene al menos una asociación parada-línea habilitada.
     * Si no tiene asociaciones habilitadas, debe estar deshabilitada.
     */
    private void actualizarEstadoParada(Parada parada) {
        try {
            // Obtener todas las asociaciones de esta parada
            List<ParadaLinea> asociaciones = paradaLineaRepository.findByParadaId(parada.getId());
            
            // Verificar si tiene al menos una asociación habilitada
            boolean tieneAsociacionHabilitada = asociaciones.stream()
                    .anyMatch(ParadaLinea::isEstaHabilitada);
            
            boolean estadoActual = parada.isHabilitada();
            
            if (estadoActual != tieneAsociacionHabilitada) {
                parada.setHabilitada(tieneAsociacionHabilitada);
                paradaRepository.save(parada);
                
                log.info("Estado de parada {} actualizado: {} -> {} (asociaciones habilitadas: {})", 
                        parada.getId(), estadoActual, tieneAsociacionHabilitada,
                        asociaciones.stream().mapToLong(pl -> pl.isEstaHabilitada() ? 1 : 0).sum());
            } else {
                log.debug("Estado de parada {} sin cambios: {} (asociaciones habilitadas: {})", 
                        parada.getId(), estadoActual,
                        asociaciones.stream().mapToLong(pl -> pl.isEstaHabilitada() ? 1 : 0).sum());
            }
        } catch (Exception e) {
            log.error("Error al actualizar estado de parada {}: {}", parada.getId(), e.getMessage(), e);
        }
    }

    /**
     * Actualiza el estado de múltiples paradas de forma eficiente
     */
    private void actualizarEstadoParadas(List<Parada> paradas) {
        for (Parada parada : paradas) {
            actualizarEstadoParada(parada);
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
            parada.setHabilitada(false);
        } else {
            // Si tiene al menos una línea habilitada, habilitar la parada
            parada.setHabilitada(true);
        }
        
        paradaRepository.save(parada);
    }

    /**
     * Valida que una ruta cumple con todos los criterios requeridos:
     * 1. Está completamente sobre la caminera nacional (con buffer)
     * 2. Los puntos inicial y final están cerca de paradas existentes
     * @param routeGeoJSON GeoJSON LineString de la ruta
     * @throws IllegalArgumentException si la ruta no cumple con algún criterio
     */
    public void validarRutaCompleta(String routeGeoJSON) {
        if (routeGeoJSON == null || routeGeoJSON.trim().isEmpty()) {
            throw new IllegalArgumentException("El GeoJSON de la ruta no puede estar vacío.");
        }
        
        try {
            // 1. Validar que la ruta esté sobre la caminera nacional
            double bufferCaminera = 40.0; // Buffer para caminera
            Boolean isWithinBuffer = routingRepository.validateRouteWithinBuffer(routeGeoJSON, bufferCaminera);
            
            if (!isWithinBuffer) {
                throw new IllegalArgumentException("La ruta generada se sale de los límites de la caminera nacional. " +
                    "Por favor, modifique los puntos para que la ruta se mantenga dentro de la red vial autorizada.");
            }
            
            // 2. Validar que los extremos estén cerca de paradas
            double bufferParadas = 50.0; // Buffer para paradas (50 metros)
            Boolean endpointsNearStops = routingRepository.validateRouteEndpointsNearStops(routeGeoJSON, bufferParadas);
            
            if (!endpointsNearStops) {
                // Obtener información detallada para dar un mensaje más específico
                String endpointsInfo = routingRepository.getRouteEndpointsStopsInfo(routeGeoJSON, bufferParadas);
                throw new IllegalArgumentException("Los puntos inicial y final de la ruta deben estar cerca (50 metros) de paradas existentes. " +
                    "Estado actual: " + endpointsInfo + ". " +
                    "Por favor, asegúrese de que el recorrido comience y termine cerca de paradas.");
            }
            
        } catch (Exception e) {
            if (e instanceof IllegalArgumentException) {
                throw e;
            }
            throw new IllegalArgumentException("Error al validar la ruta: " + e.getMessage());
        }
    }

    /**
     * Habilita automáticamente una parada que está siendo usada como punto extremo de una línea
     * @param parada La parada a habilitar
     */
    private void habilitarParadaAutomaticamente(Parada parada) {
        if (!parada.isHabilitada()) {
            parada.setHabilitada(true);
            paradaRepository.save(parada);
            log.info("Parada {} habilitada automáticamente por ser punto extremo de línea", parada.getId());
        }
    }

    // Asocia y habilita automáticamente las paradas de los extremos de la línea
    private void asociarParadasExtremos(Linea linea, Point puntoOrigen, Point puntoDestino) {
        // Origen
        Parada paradaOrigen = buscarParadaCercana(puntoOrigen, PARADA_ASOCIACION_DIST);
        if (paradaOrigen != null) {
            asociarYHabilitarParadaLinea(paradaOrigen, linea);
        }

        // Destino (evitar duplicado si es la misma parada)
        Parada paradaDestino = buscarParadaCercana(puntoDestino, PARADA_ASOCIACION_DIST);
        if (paradaDestino != null && (paradaOrigen == null || !Objects.equals(paradaDestino.getId(), paradaOrigen.getId()))) {
            asociarYHabilitarParadaLinea(paradaDestino, linea);
        }
    }

    // Crea o habilita la asociación Parada-Línea y habilita la parada si es necesario
    private void asociarYHabilitarParadaLinea(Parada parada, Linea linea) {
        ParadaLinea asociacion = paradaLineaRepository.findByParadaIdAndLineaId(parada.getId(), linea.getId());
        if (asociacion == null) {
            ParadaLinea nueva = ParadaLinea.builder()
                .parada(parada)
                .linea(linea)
                .estaHabilitada(true)
                .build();
            paradaLineaRepository.save(nueva);
        } else if (!asociacion.isEstaHabilitada()) {
            asociacion.setEstaHabilitada(true);
            paradaLineaRepository.save(asociacion);
        }
        if (!parada.isHabilitada()) {
            parada.setHabilitada(true);
            paradaRepository.save(parada);
        }
    }

    /**
     * Obtiene los IDs de todas las paradas asociadas a una lista de líneas
     * Para uso en filtros WMS simples
     */
    public List<Integer> obtenerIdsParadasPorLineas(List<Long> idsLineas) {
        log.info("Obteniendo IDs de paradas para líneas: {}", idsLineas);
        
        if (idsLineas == null || idsLineas.isEmpty()) {
            return new ArrayList<>();
        }
        
        try {
            // Obtener todas las asociaciones parada-línea para las líneas especificadas
            List<ParadaLinea> asociaciones = paradaLineaRepository.findByLineaIdInAndEstaHabilitadaTrue(idsLineas);
            
            // Extraer los IDs únicos de las paradas
            Set<Integer> idsParadasSet = asociaciones.stream()
                .map(asociacion -> asociacion.getParada().getId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
            
            List<Integer> idsParadas = new ArrayList<>(idsParadasSet);
            log.info("Encontradas {} paradas únicas para {} líneas", idsParadas.size(), idsLineas.size());
            
            return idsParadas;
        } catch (Exception e) {
            log.error("Error al obtener IDs de paradas para líneas {}: {}", idsLineas, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

}
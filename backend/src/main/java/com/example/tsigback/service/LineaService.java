package com.example.tsigback.service;

import com.example.tsigback.entities.Linea;
import com.example.tsigback.entities.Parada;
import com.example.tsigback.entities.ParadaLinea;
import com.example.tsigback.entities.dtos.LineaDTO;
import com.example.tsigback.entities.dtos.PuntoDTO;
import com.example.tsigback.entities.enums.EstadoParada;
import com.example.tsigback.exception.LineaNoEncontradaException;
import com.example.tsigback.repository.LineaRepository;
import com.example.tsigback.repository.ParadaRepository;
import com.example.tsigback.repository.RoutingRepository;
import com.example.tsigback.repository.ParadaLineaRepository;
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
                .nombre(linea.getDescripcion())
                .descripcion(linea.getObservacion())
                .empresa(linea.getEmpresa())
                .observacion(linea.getObservacion())
                .origen(linea.getOrigen())
                .destino(linea.getDestino())
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
                .nombre(linea.getDescripcion())
                .descripcion(linea.getObservacion())
                .empresa(linea.getEmpresa())
                .observacion(linea.getObservacion())
                .origen(linea.getOrigen())
                .destino(linea.getDestino())
                .paradaLineaIds(paradaLineaIds)
                // No incluye puntos, rutaGeoJSON ni recorrido
                .build();
    }

    public void eliminarLineaYRelaciones(int id) throws LineaNoEncontradaException {
        Linea linea = lineaRepository.findById(id)
                .orElseThrow(() -> new LineaNoEncontradaException("Línea con id " + id + " no encontrada"));

        List<ParadaLinea> paradaLineas = linea.getParadasLineas();
        for (ParadaLinea pl : paradaLineas) {
            Parada parada = pl.getParada();
            paradaLineaRepository.delete(pl);

            List<ParadaLinea> restantes = paradaLineaRepository.findByParadaId(parada.getId());
            if (restantes.isEmpty()) {
                parada.setEstado(EstadoParada.DESHABILITADA);
                paradaRepository.save(parada);
            }
        }
        lineaRepository.delete(linea);
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

        linea.setDescripcion(lineaDTO.getDescripcion() != null ? lineaDTO.getDescripcion() : linea.getDescripcion());
        linea.setEmpresa(lineaDTO.getEmpresa() != null ? lineaDTO.getEmpresa() : linea.getEmpresa());
        linea.setObservacion(lineaDTO.getObservacion() != null ? lineaDTO.getObservacion() : linea.getObservacion());

        List<PuntoDTO> puntosDtos = lineaDTO.getPuntos();

        if (puntosDtos != null && puntosDtos.size() > 1) {
            MultiLineString nuevoRecorrido = GeoUtils.geoJsonToMultiLineString(lineaDTO.getRutaGeoJSON());

            List<ParadaLinea> paradas = linea.getParadasLineas();
            // Itero por todas las paradas que estan asociadas en la lineas
            /*
             * for (ParadaLinea parada : paradas) {
             * procesamientoDeParadaLinea(parada, linea, nuevoRecorrido);
             * }
             */

            String origen = lineaRepository.obtenerDepartamentoOrigen(getPuntoDeOrigen(puntosDtos));
            String destino = lineaRepository.obtenerDepartamentoDestino(getPuntoDestino(puntosDtos));
            linea.setOrigen(origen);
            linea.setDestino(destino);
        }

        lineaRepository.save(linea);
    }

    private void procesamientoDeParadaLinea(ParadaLinea parada, Linea linea, MultiLineString nuevoRecorrido) {
        Parada paradaAsociada = parada.getParada();

        // Reviso si la parada esta cerca de la nueva linea
        if (!lineaRepository.esNuevaParadaCercaDeParada(nuevoRecorrido, parada.getParada().getUbicacion(), 100.0)) {
            // Si es 1, es porque solamente esta asociada a una linea
            if (estaAsociadoUnicamenteAEstaLinea(paradaAsociada)) {
                paradaAsociada.setEstado(EstadoParada.DESHABILITADA);
            }
            paradaRepository.save(paradaAsociada);
        }

        parada.setEstaHabilitada(false);
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

}
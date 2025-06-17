package com.example.tsigback.service;

import com.example.tsigback.entities.Linea;
import com.example.tsigback.entities.Parada;
import com.example.tsigback.entities.ParadaLinea;
import com.example.tsigback.entities.dtos.LineaDTO;
import com.example.tsigback.entities.dtos.ParadaDTO;
import com.example.tsigback.entities.dtos.PuntoDTO;
import com.example.tsigback.entities.enums.EstadoParada;
import com.example.tsigback.exception.LineaNoEncontradaException;
import com.example.tsigback.repository.LineaRepository;
import com.example.tsigback.repository.ParadaRepository;
import com.example.tsigback.repository.RoutingRepository;
import com.example.tsigback.utils.GeoUtils;

import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.geom.MultiPoint;
import org.locationtech.jts.geom.Point;
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
    private ParadaRepository paradaRepository;

    @Autowired
    private RoutingRepository routingRepository;

    private static final double MAX_DIST = 100.0; // metros

    public void crearLinea(LineaDTO linea) {
        try {
            MultiLineString recorrido = calculateRoute(linea.getPuntos());
            MultiPoint puntos = GeoUtils.crearMultiPointDesdeDTOs(linea.getPuntos());

            Point puntoOrigen = getPuntoDeOrigen(linea.getPuntos());
            Point puntoDestino = getPuntoDestino(linea.getPuntos());
            String origen = lineaRepository.obtenerDepartamentoOrigen(puntoOrigen);
            String destino = lineaRepository.obtenerDepartamentoDestino(puntoDestino);
        
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
        return GeoUtils.crearPunto(primerPuntoDTO.getLon(), primerPuntoDTO.getLat());
    }

    private Point getPuntoDestino(List<PuntoDTO> puntos) {
        PuntoDTO ultimoPuntoDTO = puntos.get(puntos.size() - 1);
        return GeoUtils.crearPunto(ultimoPuntoDTO.getLon(), ultimoPuntoDTO.getLat());
    }

    public String calculateRouteGeoJSON(List<PuntoDTO> puntos) {
        MultiLineString multiLineString = calculateRoute(puntos);
        GeoJsonWriter writer = new GeoJsonWriter();
        return writer.write(multiLineString);
    }

    public List<PuntoDTO> crearPuntoDTO(double lon, double lat) {
        return List.of(new PuntoDTO(lon, lat));
    }

    private MultiLineString calculateRoute(List<PuntoDTO> puntos) {
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

    public void modificarLinea(LineaDTO lineaDTO) throws LineaNoEncontradaException {
        Linea linea = lineaRepository.findById(lineaDTO.getId().intValue())
            .orElseThrow(() -> new LineaNoEncontradaException("La linea con id " + lineaDTO.getId() + " no ha sido encontrada"));
        
        linea.setDescripcion(lineaDTO.getDescripcion() != null ? lineaDTO.getDescripcion() : linea.getDescripcion());
        linea.setEmpresa(lineaDTO.getEmpresa() != null ? lineaDTO.getEmpresa() : linea.getEmpresa());
        linea.setObservacion(lineaDTO.getObservacion() != null ? lineaDTO.getObservacion() : linea.getObservacion());
        
        List<PuntoDTO> puntosDtos = lineaDTO.getPuntos();

        if (puntosDtos != null && puntosDtos.size() > 1) {
            MultiLineString nuevoRecorrido = calculateRoute(lineaDTO.getPuntos());

            List<ParadaLinea> paradas = linea.getParadasLineas();
            //Itero por todas las paradas que estan asociadas en la lineas
            for (ParadaLinea parada : paradas) {
                procesamientoDeParadaLinea(parada, linea, nuevoRecorrido);
            }

            String origen = lineaRepository.obtenerDepartamentoOrigen(getPuntoDeOrigen(puntosDtos));
            String destino = lineaRepository.obtenerDepartamentoDestino(getPuntoDestino(puntosDtos));
            linea.setOrigen(origen);
            linea.setDestino(destino);
            linea.setRecorrido(nuevoRecorrido);
        }
        
        lineaRepository.save(linea);
    }

    private void procesamientoDeParadaLinea(ParadaLinea parada, Linea linea, MultiLineString nuevoRecorrido) {
        Parada paradaAsociada = parada.getParada();
                
        // Reviso si la parada esta cerca de la nueva linea
        if (!lineaRepository.isPuntoCercaDeAlgunaLinea(linea.getId(), parada.getParada().getUbicacion(), 100, nuevoRecorrido)) {
            
            //Si es 1, es porque solamente esta asociada a una linea
            if (estaAsociadoUnicamenteAEstaLinea(paradaAsociada)) {
                paradaAsociada.setEstado(EstadoParada.DESHABILITADA);        
            }
            paradaRepository.save(paradaAsociada);
        }

        parada.setEstaHabilitada(false);
    }

    private boolean estaAsociadoUnicamenteAEstaLinea(Parada paradaAsociada) {
        //Me fijo las lineas que estan habilitadas
        return paradaAsociada
                .getLineas()
                .stream()
                .filter(paradaLinea -> paradaLinea.isEstaHabilitada())
                .count() == 1;
    }

    public List<LineaDTO> obtenerTodas() {
        return null;
       // return lineaRepository.findAll();
    }

    private LineaDTO toDTO(Linea linea) {

        // 1. Convertir MultiPoint a lista de [lon, lat]
        List<ParadaDTO> listaPuntos = null;
        if (linea.getPuntos() != null) {
            listaPuntos = new ArrayList<>();
            for (int i = 0; i < linea.getPuntos().getNumGeometries(); i++) {
                var p = (org.locationtech.jts.geom.Point) linea.getPuntos().getGeometryN(i);
                listaPuntos.add(ParadaDTO.builder().longitud(p.getX()).latitud(p.getY()).build());
            }
        }

        // 2. Recorrido a WKT
        String wkt = (linea.getRecorrido() != null) ? linea.getRecorrido().toText() : null;

        // 3. Ids de ParadaLinea habilitadas
        List<Integer> paradaLineaIds = null;
        if (linea.getParadasLineas() != null) {
            paradaLineaIds = linea.getParadasLineas().stream()
                    .filter(ParadaLinea::isEstaHabilitada)
                    .map(ParadaLinea::getId)
                    .toList();
        }

        return LineaDTO.builder()
                .id(linea.getId())
                .descripcion(linea.getDescripcion())
                .empresa(linea.getEmpresa())
                .origen(linea.getOrigen())
                .destino(linea.getDestino())
                .observacion(linea.getObservacion())
                //.puntos(listaPuntos)
                .recorridoWkt(wkt)
                .paradasLineaIds(paradaLineaIds)
                .build();
    }
}
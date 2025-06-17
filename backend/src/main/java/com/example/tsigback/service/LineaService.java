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
import java.util.stream.Collectors;

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
            System.out.println("DEBUG puntos recibidos: " + linea.getPuntos());
            System.out.println("DEBUG rutaGeoJSON recibido: " + linea.getRutaGeoJSON());
            if (linea.getRutaGeoJSON() == null || linea.getRutaGeoJSON().trim().isEmpty() || linea.getRutaGeoJSON().equals("null")) {
                throw new IllegalArgumentException("El campo rutaGeoJSON no puede ser nulo, vacío ni 'null'.");
            }
            MultiLineString recorrido = GeoUtils.geoJsonToMultiLineString(linea.getRutaGeoJSON());
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
                throw new IllegalArgumentException("No se pudo calcular la distancia para el punto (" + pt.getLatitud() + ", " + pt.getLongitud() + ").");
            }
            if (dist > MAX_DIST) {
                throw new IllegalArgumentException("El punto (" + pt.getLatitud() + ", " + pt.getLongitud() + ") está a más de 100 metros de la red.");
            }
        }
    }

    public void modificarLinea(LineaDTO lineaDTO) throws LineaNoEncontradaException {
        Linea linea = lineaRepository.findById(lineaDTO.getId())
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
        return lineaRepository.findAll()
        .stream().map(l -> toDTO(l))
        .collect(Collectors.toList()); 
    }

    private LineaDTO toDTO(Linea linea) {

        // 1. Convertir MultiPoint a lista de [lon, lat]
        List<PuntoDTO> listaPuntos = null;
        if (linea.getPuntos() != null) {
            listaPuntos = new ArrayList<>();
            for (int i = 0; i < linea.getPuntos().getNumGeometries(); i++) {
                var p = (org.locationtech.jts.geom.Point) linea.getPuntos().getGeometryN(i);
                listaPuntos.add(PuntoDTO.builder().lon(p.getX()).lat(p.getY()).build());
            }
        }

        // 2. Recorrido a WKT
        String wkt = (linea.getRecorrido() != null) ? linea.getRecorrido().toText() : null;

        // 3. Ids de ParadaLinea habilitadas
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
                .origen(linea.getOrigen())
                .destino(linea.getDestino())
                .observacion(linea.getObservacion())
                .puntos(listaPuntos)
                .recorrido(wkt)
                .paradaLineaIds(paradaLineaIds)
                .build();
    }
}
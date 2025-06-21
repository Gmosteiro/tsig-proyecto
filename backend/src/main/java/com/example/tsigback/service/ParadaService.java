package com.example.tsigback.service;

import com.example.tsigback.entities.HorarioParadaLinea;
import com.example.tsigback.entities.Linea;
import com.example.tsigback.entities.Parada;
import com.example.tsigback.entities.ParadaLinea;
import com.example.tsigback.entities.dtos.HorarioDTO;
import com.example.tsigback.entities.dtos.ParadaDTO;
import com.example.tsigback.entities.dtos.ParadaLineaDTO;
import com.example.tsigback.entities.enums.EstadoParada;
import com.example.tsigback.exception.EntidadYaExistenteException;
import com.example.tsigback.exception.LineaNoEncontradaException;
import com.example.tsigback.exception.ParadaLejosDeRutaException;
import com.example.tsigback.exception.ParadaLineaNoEncontradaException;
import com.example.tsigback.exception.ParadaNoEncontradaException;
import com.example.tsigback.repository.LineaRepository;
import com.example.tsigback.repository.ParadaLineaRepository;
import com.example.tsigback.repository.ParadaRepository;
import com.example.tsigback.utils.GeoUtils;

import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ParadaService {

    private final static Double DEFAULT_BUFFER = 100.0;

    @Autowired
    private ParadaRepository paradaRepository;

    @Autowired
    private ParadaLineaRepository paradaLineaRepository;

    @Autowired 
    private LineaRepository lineaRepository;

    public void altaParada(ParadaDTO paradaDTO) throws ParadaLejosDeRutaException {
        Point ubicacion = GeoUtils.crearPunto(paradaDTO.getLongitud(), paradaDTO.getLatitud());

        if (ubicacion == null) {
            throw new RuntimeException("No se puede crear un ubicacion");
        }

        if (!paradaRepository.isRutaCercana(ubicacion,DEFAULT_BUFFER)) {
            throw new ParadaLejosDeRutaException("Esta ingresando una parada a una distancia mayor de " + DEFAULT_BUFFER + "mt de una ruta nacional ");
        }

        Parada nuevaParada = Parada.builder()
                .ubicacion(ubicacion)
                .nombre(paradaDTO.getNombre())
                .estado(paradaDTO.getEstado())
                .refugio(paradaDTO.isRefugio())
                .observacion(paradaDTO.getObservacion())
                .build();

        paradaRepository.save(nuevaParada);
    }

    public void modificarParada(ParadaDTO paradaDTO) throws ParadaNoEncontradaException, ParadaLejosDeRutaException {
        Parada parada = paradaRepository.findById(paradaDTO.getId())
              .orElseThrow(() -> new ParadaNoEncontradaException("Parada con nombre " + paradaDTO.getNombre() + " no encontrada"));

        Point ubicacion = null;
        if (paradaDTO.getLongitud() != 0.0 && paradaDTO.getLatitud() != 0.0){
            ubicacion = GeoUtils.crearPunto(paradaDTO.getLongitud(), paradaDTO.getLatitud());
        }

        if (!paradaRepository.isRutaCercana(ubicacion,DEFAULT_BUFFER)) {
            throw new ParadaLejosDeRutaException("Esta ingresando una parada a una distancia mayor de " + DEFAULT_BUFFER + "mt de una ruta nacional ");
        }

        if (ubicacion != null) {
            parada.setUbicacion(ubicacion);
        }

        parada.setNombre(paradaDTO.getNombre());
        parada.setEstado(paradaDTO.getEstado());
        parada.setRefugio(paradaDTO.isRefugio());
        parada.setEstado(paradaDTO.getEstado());
        parada.setObservacion(paradaDTO.getObservacion());

        paradaRepository.save(parada);
    }

    public void eliminarParada(int id) throws ParadaNoEncontradaException {
        Parada parada = paradaRepository.findById(id)
              .orElseThrow(() -> new ParadaNoEncontradaException("Parada con id " + id + " no encontrada"));

        paradaLineaRepository.deshabilitarPorParadaId(parada.getId());
        parada.setEstado(EstadoParada.HABILITADA);
        paradaRepository.delete(parada);
    }

     public void agregarLineaAParada(ParadaLineaDTO dto) throws ParadaNoEncontradaException, LineaNoEncontradaException, EntidadYaExistenteException, ParadaLejosDeRutaException {
        Parada parada = paradaRepository.findById(dto.getIdParada())
            .orElseThrow(() -> new ParadaNoEncontradaException("Parada no encontrada con id " + dto.getIdParada()));

        Linea linea = lineaRepository.findById(dto.getIdLinea())
            .orElseThrow(() -> new LineaNoEncontradaException("Linea no encontrada con id " + dto.getIdLinea()));

            
        ParadaLinea paradaLinea = paradaLineaRepository
            .findByParadaIdAndLineaId(dto.getIdParada(), dto.getIdLinea());


        if (paradaLinea != null) {
            throw new EntidadYaExistenteException("Linea " + + dto.getIdLinea() + " ya relacionada con la parada " + dto.getIdParada());
        }

        if (!lineaRepository.esParadaCercaDelRecorrido(parada.getUbicacion(), linea.getId(), 100.0)) {
            throw new ParadaLejosDeRutaException("La parada " + dto.getIdParada() + " se encuentra lejos de la linea " + dto.getIdLinea());
        }
        
        ParadaLinea nuevaParadaLinea = ParadaLinea.builder()
                .parada(parada)
                .linea(linea)
                .estaHabilitada(true)
                .build();

        List<HorarioParadaLinea> horarios = dto.getHorarios().stream()
            .map(horarioDto -> HorarioParadaLinea.builder()
                .horario(horarioDto.getHora())
                .paradaLinea(nuevaParadaLinea)
                .build())
            .toList();

        nuevaParadaLinea.setHorarios(horarios);

        if (parada.getEstado() == EstadoParada.DESHABILITADA) {
            parada.setEstado(EstadoParada.HABILITADA);
        }

        paradaLineaRepository.save(nuevaParadaLinea);
    }

     public void agregarHorario(ParadaLineaDTO paradaLineaDTO) throws ParadaNoEncontradaException, LineaNoEncontradaException, ParadaLineaNoEncontradaException {
        ParadaLinea paradaLinea = paradaLineaRepository.findById(paradaLineaDTO.getIdParadaLinea())
            .orElseThrow(() -> new ParadaLineaNoEncontradaException("No existe esa parada linea id"));

    List<HorarioParadaLinea> nuevosHorarios = paradaLineaDTO.getHorarios().stream()
        .map(horarioDto -> HorarioParadaLinea.builder()
            .horario(horarioDto.getHora())
            .paradaLinea(paradaLinea)
            .build())
        .toList();

    // Agrega los nuevos horarios a la colección existente
    paradaLinea.getHorarios().addAll(nuevosHorarios);

    paradaLineaRepository.save(paradaLinea);     
     }

    public List<ParadaDTO> obtenerTodasLasParadas() {
        return paradaRepository.findAll().stream()
            .map(p -> toDTO(p)) 
            .collect(Collectors.toList()); 
    }

    public List<ParadaLineaDTO> obtenerTodasLasParadasLineas() {
        return paradaLineaRepository.findAll().stream()
                    .map(pl -> paradaLineaToDTO(pl))
                    .collect(Collectors.toList()); 
    }

    private ParadaDTO toDTO(Parada parada) {
        return ParadaDTO.builder()
                    .id(parada.getId())
                    .nombre(parada.getNombre())
                    .estado(parada.getEstado())
                    .refugio(parada.isRefugio())
                    .observacion(parada.getObservacion())
                    .latitud(parada.getUbicacion().getY())   
                    .longitud(parada.getUbicacion().getX())   
                    .build();
    }

    private ParadaLineaDTO paradaLineaToDTO (ParadaLinea paradaLinea) {
        ParadaLineaDTO paradaLineaDTO = new ParadaLineaDTO();
        paradaLineaDTO.setIdParadaLinea(paradaLinea.getId());
        paradaLineaDTO.setIdLinea(paradaLinea.getLinea().getId());
        paradaLineaDTO.setIdParada(paradaLinea.getParada().getId());

        List<HorarioDTO> horarios = new ArrayList<>();
        for (HorarioParadaLinea iHorario : paradaLinea.getHorarios()) {
            horarios.add(HorarioDTO.builder().hora(iHorario.getHorario()).build());
        }
        paradaLineaDTO.setHorarios(horarios);
        return paradaLineaDTO;
    }
    

}

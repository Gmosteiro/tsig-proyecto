package com.example.tsigback.service;

import com.example.tsigback.entities.HorarioParadaLinea;
import com.example.tsigback.entities.Linea;
import com.example.tsigback.entities.Parada;
import com.example.tsigback.entities.ParadaLinea;
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

import java.util.List;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
        Parada parada = paradaRepository.findByNombre(paradaDTO.getNombre());

        if (parada == null) {
            throw new ParadaNoEncontradaException("Parada con nombre " + paradaDTO.getNombre() + " no encontrada");
        }

        Point ubicacion = GeoUtils.crearPunto(paradaDTO.getLongitud(), paradaDTO.getLatitud());

        if (!paradaRepository.isRutaCercana(ubicacion,DEFAULT_BUFFER)) {
            throw new ParadaLejosDeRutaException("Esta ingresando una parada a una distancia mayor de " + DEFAULT_BUFFER + "mt de una ruta nacional ");
        }

        Parada paradaModificada = Parada.builder()
                .ubicacion(ubicacion)
                .nombre(paradaDTO.getNombre())
                .estado(paradaDTO.getEstado())
                .refugio(paradaDTO.isRefugio())
                .observacion(paradaDTO.getObservacion())
                .build();

        paradaRepository.save(paradaModificada);
    }

    public void eliminarParada(String nombre) throws ParadaNoEncontradaException {
        Parada parada = paradaRepository.findByNombre(nombre);

        if (parada == null) {
            throw new ParadaNoEncontradaException("Parada con nombre " + nombre + " no encontrada");
        }

        paradaLineaRepository.deshabilitarPorParadaId(parada.getId());
        parada.setEstado(EstadoParada.HABILITADA);
        paradaRepository.save(parada);
    }

     public void agregarLineaAParada(ParadaLineaDTO dto) throws ParadaNoEncontradaException, LineaNoEncontradaException, EntidadYaExistenteException {
        Parada parada = paradaRepository.findById(dto.getIdParada())
            .orElseThrow(() -> new ParadaNoEncontradaException("Parada no encontrada con id " + dto.getIdParada()));

        Linea linea = lineaRepository.findById(dto.getIdLinea())
            .orElseThrow(() -> new LineaNoEncontradaException("Linea no encontrada con id " + dto.getIdLinea()));

            
        ParadaLinea paradaLinea = paradaLineaRepository
            .findByParadaIdAndLineaId(dto.getIdParada(), dto.getIdLinea());


        if (paradaLinea != null) {
            throw new LineaNoEncontradaException("Linea no encontrada con id " + dto.getIdLinea());
        }
        
        ParadaLinea nuevaParadaLinea = ParadaLinea.builder()
                .parada(parada)
                .linea(linea)
                .estaHabilitada(true)
                .build();

        List<HorarioParadaLinea> horarios = dto.getHorario().stream()
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
        paradaRepository.findById(paradaLineaDTO.getIdParada())
            .orElseThrow(() -> new ParadaNoEncontradaException("Parada no encontrada con id " + paradaLineaDTO.getIdParada()));

        lineaRepository.findById(paradaLineaDTO.getIdLinea())
            .orElseThrow(() -> new LineaNoEncontradaException("Linea no encontrada con id " + paradaLineaDTO.getIdLinea()));
            
        ParadaLinea paradaLinea = paradaLineaRepository.findById(paradaLineaDTO.getIdLinea())
            .orElseThrow(() -> new ParadaLineaNoEncontradaException("Asociasion entre parada con id " + paradaLineaDTO.getIdParada()
             +  "y linea " + paradaLineaDTO.getIdLinea() + "no existente"));

        List<HorarioParadaLinea> horarios = paradaLineaDTO.getHorario().stream()
            .map(horarioDto -> HorarioParadaLinea.builder()
                .horario(horarioDto.getHora())
                .paradaLinea(paradaLinea)
                .build())
            .toList();

        paradaLinea.setHorarios(horarios);

        paradaLineaRepository.save(paradaLinea);     

     }


}

package com.example.tsigback.service;

import com.example.tsigback.entities.HorarioParadaLinea;
import com.example.tsigback.entities.Linea;
import com.example.tsigback.entities.Parada;
import com.example.tsigback.entities.ParadaLinea;
import com.example.tsigback.entities.dtos.ParadaDTO;
import com.example.tsigback.entities.dtos.ParadaLineaDTO;
import com.example.tsigback.entities.enums.EstadoParada;
import com.example.tsigback.exception.ParadaLejosDeRutaException;
import com.example.tsigback.exception.ParadaNoEncontradaException;
import com.example.tsigback.repository.LineaRepository;
import com.example.tsigback.repository.ParadaLineaRepository;
import com.example.tsigback.repository.ParadaRepository;
import com.example.tsigback.utils.GeoUtils;

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

     public void agregarLineaAParada(ParadaLineaDTO dto) {
        Parada parada = paradaRepository.findById(dto.getIdParada())
            .orElseThrow(() -> new RuntimeException("Parada no encontrada con id " + dto.getIdParada()));

        Linea linea = lineaRepository.findById(dto.getIdLinea())
            .orElseThrow(() -> new RuntimeException("Linea no encontrada con id " + dto.getIdLinea()));

        // 2. Verificar si ya existe la relación (opcional, para evitar duplicados)
        ParadaLinea existente = paradaLineaRepository
            .findByParadaIdAndLineaId(dto.getIdParada(), dto.getIdLinea())
            .orElse(null);

        ParadaLinea paradaLinea;
        if (existente != null) {
            paradaLinea = existente;
            paradaLinea.setEstaHabilitada(true);
            paradaLinea.getHorarios().clear(); // limpiar horarios anteriores si se va a actualizar
        } else {
            paradaLinea = ParadaLinea.builder()
                .parada(parada)
                .linea(linea)
                .estaHabilitada(true)
                .build();
        }

        // 3. Crear los horarios
        List<HorarioParadaLinea> horarios = dto.getHorario().stream()
            .map(horarioDto -> HorarioParadaLinea.builder()
                .horario(horarioDto.getHora())
                .paradaLinea(paradaLinea)
                .build())
            .toList();

        paradaLinea.setHorarios(horarios);

        // 4. Guardar la relación (y los horarios en cascada)
        paradaLineaRepository.save(paradaLinea);
    }


}

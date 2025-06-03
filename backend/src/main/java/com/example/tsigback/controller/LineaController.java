package com.example.tsigback.controller;

import com.example.tsigback.entities.dtos.LineaDTO;
import com.example.tsigback.entities.dtos.PuntoDTO;
import com.example.tsigback.entities.dtos.RoutingRequestDTO;
import com.example.tsigback.service.LineaService;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lineas")
public class LineaController {

    @Autowired
    private LineaService lineaService;

    @PostMapping
    public ResponseEntity<String> altaLinea(@RequestBody LineaDTO lineaDTO) {
        if (lineaDTO == null || lineaDTO.getPuntos() == null || lineaDTO.getPuntos().isEmpty()) {
            return ResponseEntity.badRequest().body("No se puede crear una línea nula o sin puntos.");
        }
        lineaService.crearLinea(lineaDTO);
        return ResponseEntity.ok("Linea creada correctamente");
    }

    @PostMapping("/shortest-path")
    public ResponseEntity<?> getShortestPath(@RequestBody RoutingRequestDTO request) {
        try {
            List<PuntoDTO> puntosDTO = new ArrayList<>();
            request.getPoints().forEach(punto -> {
                puntosDTO.add(punto);
            });
            String geojson = lineaService.calculateRouteGeoJSON(puntosDTO);
            return ResponseEntity.ok(geojson);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Internal error");
        }
    }


}
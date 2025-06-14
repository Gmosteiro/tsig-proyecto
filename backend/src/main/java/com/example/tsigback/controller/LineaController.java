package com.example.tsigback.controller;

import com.example.tsigback.entities.dtos.LineaDTO;
import com.example.tsigback.entities.dtos.ListaPuntosDTO;
import com.example.tsigback.entities.dtos.PuntoDTO;
import com.example.tsigback.exception.LineaNoEncontradaException;
import com.example.tsigback.service.LineaService;

import jakarta.websocket.server.PathParam;

import java.util.ArrayList;
import java.util.List;

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
    public ResponseEntity<?> getShortestPath(@RequestBody ListaPuntosDTO request) {
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
            return ResponseEntity.internalServerError().body("Internal error: " + e.getMessage());
        }
    }

    @PutMapping
    public ResponseEntity<String> modificarLinea(@RequestBody LineaDTO lineaDTO) {
        try {
            if (lineaDTO == null) {
                return ResponseEntity.badRequest().body("La linea que quieres modificar es nula");
            }
            lineaService.modificarLinea(lineaDTO);
            return ResponseEntity.ok("El id linea " + lineaDTO.getId() + " ha sido modificado con exito");
        } catch (LineaNoEncontradaException e) {
            //Devuelvo un badRequest porque el notFound no me deja agregarle body
            return ResponseEntity.badRequest().body("El id linea " + lineaDTO.getId() + " no existe en la base de datos");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Internal error: " + e.getMessage());
        }
    }



}
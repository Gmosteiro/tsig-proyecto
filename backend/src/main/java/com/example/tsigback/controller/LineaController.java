package com.example.tsigback.controller;

import com.example.tsigback.entities.dtos.LineaDTO;
import com.example.tsigback.entities.dtos.ListaPuntosDTO;
import com.example.tsigback.exception.LineaNoEncontradaException;
import com.example.tsigback.exception.ParadaNoEncontradaException;
import com.example.tsigback.service.LineaService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lineas")
public class LineaController {

    @Autowired
    private LineaService lineaService;

    // Base implementation for route validation
    @PostMapping("/validar")
    public ResponseEntity<?> validarRuta(@RequestBody ListaPuntosDTO request) {
        try {
            lineaService.validarDistanciaPuntosARed(request.getPoints());
            return ResponseEntity.ok("OK");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/guardar")
    public ResponseEntity<String> guardarLinea(@RequestBody LineaDTO lineaDTO) {
        if (lineaDTO == null || lineaDTO.getPuntos() == null || lineaDTO.getPuntos().isEmpty()) {
            return ResponseEntity.badRequest().body("No se puede crear una línea nula o sin puntos.");
        }
        try {
            lineaService.crearLinea(lineaDTO);
            return ResponseEntity.ok("Linea creada correctamente");
        } catch (ParadaNoEncontradaException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
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
            return ResponseEntity.badRequest().body("El id linea " + lineaDTO.getId() + " no existe en la base de datos");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Internal error: " + e.getMessage());
        }
    }

    @GetMapping("/destino/{destino}")
    public ResponseEntity<List<LineaDTO>> buscarLineaPorDestino(@PathVariable("destino") String destino) {
        try {
            if (destino == null || destino.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(lineaService.buscarLineaPorDestino(destino));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
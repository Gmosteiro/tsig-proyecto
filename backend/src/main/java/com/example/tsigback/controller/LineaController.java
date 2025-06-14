package com.example.tsigback.controller;

import com.example.tsigback.entities.dtos.LineaDTO;
import com.example.tsigback.entities.dtos.ListaPuntosDTO;
import com.example.tsigback.entities.dtos.PuntoDTO;
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

        lineaService.crearLinea(lineaDTO);
        return ResponseEntity.ok("Linea creada correctamente");
    }
}
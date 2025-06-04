package com.example.tsigback.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.tsigback.entities.dtos.ParadaLineaDTO;
import com.example.tsigback.exception.LineaNoEncontradaException;
import com.example.tsigback.exception.ParadaNoEncontradaException;
import com.example.tsigback.service.ParadaLineaService;

@RestController
@RequestMapping("/api/parada/linea")
public class ParadaLineaController {

    @Autowired
    private ParadaLineaService paradaLineaService;

    @PostMapping
    public ResponseEntity<String> altaParada(@RequestBody ParadaLineaDTO paradaLineaDTO) {
        try {
            if (paradaLineaDTO == null) {
                return new ResponseEntity<>("Datos nulos", HttpStatus.BAD_REQUEST);
            }
            paradaLineaService.altaParadaLinea(paradaLineaDTO);
            return ResponseEntity.ok("La parada se ha creado correctamente");
        } catch (ParadaNoEncontradaException pardadNoEncontradaException) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(pardadNoEncontradaException.getMessage());
        } catch (LineaNoEncontradaException lineaNoEncontradaException) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(lineaNoEncontradaException.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}
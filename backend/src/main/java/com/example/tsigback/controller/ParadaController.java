package com.example.tsigback.controller;

import com.example.tsigback.entities.dtos.ParadaDTO;
import com.example.tsigback.entities.dtos.ParadaLineaDTO;
import com.example.tsigback.exception.EntidadYaExistenteException;
import com.example.tsigback.exception.LineaNoEncontradaException;
import com.example.tsigback.exception.ParadaLejosDeRutaException;
import com.example.tsigback.exception.ParadaNoEncontradaException;
import com.example.tsigback.service.ParadaService;

import lombok.extern.slf4j.Slf4j;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/parada")
public class ParadaController {

    @Autowired
    private ParadaService paradaService;

    @PostMapping("/crear")
    public ResponseEntity<String> altaParada(@RequestBody ParadaDTO paradaDTO) {
        try {
            if (paradaDTO == null) {
                return new ResponseEntity<>("Parada nula", HttpStatus.BAD_REQUEST);
            }
            paradaService.altaParada(paradaDTO);
            return ResponseEntity.ok("La parada se ha creado correctamente");
        } catch (ParadaLejosDeRutaException paradaLejosDeRutaException) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(paradaLejosDeRutaException.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/modificar")
    public ResponseEntity<String> modificarParada(@RequestBody ParadaDTO paradaDTO) {
        try {
            
            if (paradaDTO == null) {
                return new ResponseEntity<>("Parada nula", HttpStatus.BAD_REQUEST);
            }

            paradaService.modificarParada(paradaDTO);
            return ResponseEntity.ok("La parada se ha modificado correctamente");
        } catch (ParadaNoEncontradaException paradaLejosDeRutaException) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(paradaLejosDeRutaException.getMessage());
        } catch (ParadaLejosDeRutaException paradaLejosDeRutaException) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(paradaLejosDeRutaException.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @DeleteMapping("/id/{id}")
    public ResponseEntity<String> modificarParada(@PathVariable("id") int id) {
        try {
            paradaService.eliminarParada(id);
            return ResponseEntity.ok("La parada se ha eliminado correctamente");
        } catch (ParadaNoEncontradaException paradaLejosDeRutaException) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(paradaLejosDeRutaException.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/todas")
    public ResponseEntity<List<ParadaDTO>> obtenerTodas() {
        return ResponseEntity.status(HttpStatus.OK).body(paradaService.obtenerTodasLasParadas());
    }
}

package com.example.tsigback.controller;

import com.example.tsigback.entities.request.RutaKilometroRequest;
import com.example.tsigback.entities.request.OrigenDestinoRequest;
import com.example.tsigback.entities.dtos.LineaDTO;
import com.example.tsigback.entities.dtos.ListaPuntosDTO;
import com.example.tsigback.entities.dtos.PuntoDTO;
import com.example.tsigback.exception.LineaNoEncontradaException;
import com.example.tsigback.service.LineaService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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

    @PostMapping("/origendestino")
    public ResponseEntity<?> obtenerLineasPorOrigenDestino(@RequestBody OrigenDestinoRequest request) {
        if (request == null || request.getIdDepartamentoOrigen() == 0 || request.getIdDepartamentoDestino() == 0) {
            return ResponseEntity.badRequest().body("Request inválido: Origen y destino deben ser especificados.");
        }

        try {
            List<LineaDTO> lineas = lineaService.obtenerLineasPorOrigenDestino(request.getIdDepartamentoOrigen(), request.getIdDepartamentoDestino());
            if (lineas.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron líneas para el origen y destino especificados.");
            }
            return ResponseEntity.status(HttpStatus.OK).body(lineas);
        } catch (LineaNoEncontradaException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno: " + e.getMessage());
        }
    }

    @PostMapping("/rutakm")
    public ResponseEntity<?> obtenerLineasPorRutaKilometro(@RequestBody RutaKilometroRequest request) {
        if (request == null || request.getRuta() == 0 || request.getKilometro() == 0) {
            return ResponseEntity.badRequest().body("Request inválido: Ruta y kilómetros deben ser especificados.");
        }

        try {
            List<LineaDTO> lineas = lineaService.obtenerLineasPorRutaKilometro(request.getRuta(), request.getKilometro());
            if (lineas.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron líneas para la ruta y kilómetros especificados.");
            }
            return ResponseEntity.status(HttpStatus.OK).body(lineas);
        } catch (LineaNoEncontradaException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno: " + e.getMessage());
        }
    }

    @PostMapping("/interseccion-poligono")
    public ResponseEntity<?> obtenerLineaInterseccionPoligono(@RequestBody String geoJsonPoligono) {
        if (geoJsonPoligono == null || geoJsonPoligono.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Debe enviar un GeoJSON de polígono válido.");
        }
        try {
            // Extraer geometry si es un Feature
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(geoJsonPoligono);
            if (node.has("geometry")) {
                geoJsonPoligono = node.get("geometry").toString();
            }
            List<LineaDTO> lineas = lineaService.obtenerLineasPorInterseccionPoligono(geoJsonPoligono);
            if (lineas == null || lineas.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron líneas que intersecten el polígono.");
            }
            return ResponseEntity.ok(lineas);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("GeoJSON inválido: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno: " + e.getMessage());
        }
    }


    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerLinea(@PathVariable int id) {
        if (id == 0) {
            return ResponseEntity.badRequest().body("Debe especificar un id de línea válido.");
        }
        try {
            LineaDTO linea = lineaService.obtenerLineaPorId(id);
            if (linea == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontró la línea solicitada.");
            }
            return ResponseEntity.ok(linea);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno: " + e.getMessage());
        }
    }

    
    /*@PutMapping
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

    //Estos metodos de aca abajo son para testing
    @GetMapping("/todas")
    public ResponseEntity<List<LineaDTO>> mostrarTodas() {
        return ResponseEntity.status(HttpStatus.OK).body(lineaService.obtenerTodas());
    }

    @GetMapping("/todas/sin_recorrido")
    public ResponseEntity<List<LineaDTO>> mostrarTodasSinRecorrido() {
        return ResponseEntity.status(HttpStatus.OK).body(lineaService.obtenerTodasSinRecorrido());
    }*/
}
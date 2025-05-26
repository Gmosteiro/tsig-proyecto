package com.example.tsigback.controller;

import com.example.tsigback.entities.dtos.ParadaDTO;
import com.example.tsigback.exception.ParadaLejosDeRutaException;
import com.example.tsigback.service.ParadaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

//    @PutMapping("/modificar/{latitud}/{longitud}")
//    public ResponseEntity<String> modificarParada(@PathVariable double latitud, @PathVariable double longitud) {
//        try{
//            if (paradaDTO == null) {
//                return new ResponseEntity<>("Parada nula", HttpStatus.BAD_REQUEST);
//            }
//
//
//
//        }
//    }
}

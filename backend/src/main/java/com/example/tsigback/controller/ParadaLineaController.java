package com.example.tsigback.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.tsigback.entities.dtos.ParadaLineaDTO;
import com.example.tsigback.exception.EntidadYaExistenteException;
import com.example.tsigback.exception.LineaNoEncontradaException;
import com.example.tsigback.exception.ParadaLejosDeRutaException;
import com.example.tsigback.exception.ParadaLineaNoEncontradaException;
import com.example.tsigback.exception.ParadaNoEncontradaException;
import com.example.tsigback.service.ParadaService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/parada/linea")
public class ParadaLineaController {
    
    @Autowired
    private ParadaService paradaService;

    @PostMapping("/asociar")
    public ResponseEntity<String> asociarParadaConLinea(@RequestBody ParadaLineaDTO paradaLineaDTO) {
        try {
            if (paradaLineaDTO == null || paradaLineaDTO.getIdLinea() == 0 || paradaLineaDTO.getIdParada() == 0) {
                return ResponseEntity.badRequest().body("El DTO vino con datos erroneos");
            }
            paradaService.agregarLineaAParada(paradaLineaDTO);
            return ResponseEntity.ok("Se ha asignado la parada con id " + 
                                    paradaLineaDTO.getIdParada() + " con la linea id " + 
                                    paradaLineaDTO.getIdLinea());
        } catch (ParadaNoEncontradaException | LineaNoEncontradaException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage()); 
        } catch (EntidadYaExistenteException | ParadaLejosDeRutaException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage()); 
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage()); 
        }
    }
                
            
            

    //Usa el paradalineaId
    @PostMapping("/horario")
    public ResponseEntity<String> agregarHorario(@RequestBody ParadaLineaDTO paradaLineaDTO) {
        try {
            //if (paradaLineaDTO == null || paradaLineaDTO.getIdLinea() == 0 || paradaLineaDTO.getIdParada() == 0 || paradaLineaDTO.getHorarios().size() == 0) {
            //    return ResponseEntity.badRequest().body("El DTO vino con datos erroneos");
            //}
            paradaService.agregarHorario(paradaLineaDTO);
            return ResponseEntity.ok("Se han cargado los horarios correctamente");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage()); 
        }
    }

    @GetMapping("/todas")
    public ResponseEntity<List<ParadaLineaDTO>> obtenerTodosLosHorarios() {
        return ResponseEntity.ok(paradaService.obtenerTodasLasParadasLineas());
    }

    @DeleteMapping("/{idParadaLinea}")
    public ResponseEntity<String> eliminarAsociacionParadaLinea(@PathVariable int idParadaLinea) {
        try {
            paradaService.eliminarAsociacionParadaLinea(idParadaLinea);
            return ResponseEntity.ok("La asociación parada-línea se ha eliminado correctamente");
        } catch (ParadaLineaNoEncontradaException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @DeleteMapping("/horario/{idHorario}")
    public ResponseEntity<String> eliminarHorario(@PathVariable int idHorario) {
        try {
            paradaService.eliminarHorario(idHorario);
            return ResponseEntity.ok("El horario se ha eliminado correctamente");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/{idParadaLinea}/toggle-estado")
    public ResponseEntity<String> cambiarEstadoAsociacion(@PathVariable int idParadaLinea) {
        try {
            paradaService.cambiarEstadoAsociacion(idParadaLinea);
            return ResponseEntity.ok("El estado de la asociación se ha cambiado correctamente");
        } catch (ParadaLineaNoEncontradaException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (ParadaLejosDeRutaException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<String> cambiarEstadoParadaLinea(
            @PathVariable int id,
            @RequestParam boolean habilitada) {
        try {
            paradaService.cambiarEstadoParadaLinea(id, habilitada);
            String estado = habilitada ? "habilitada" : "deshabilitada";
            return ResponseEntity.ok("La asociación parada-línea ha sido " + estado + " correctamente");
        } catch (ParadaLineaNoEncontradaException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (ParadaLejosDeRutaException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno: " + e.getMessage());
        }
    }

}

package com.example.tsigback.controller;

import com.example.tsigback.exception.UsuarioNoEncontradoException;
import com.example.tsigback.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    public AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody Map<String, String> credentials) {

        String nombreUsuario = credentials.get("email"); // o "nombreUsuario"
        String contrasenia = credentials.get("password"); // o "contrasenia"

        if (nombreUsuario == null || contrasenia == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Nombre de usuario o contraseña faltantes");
        }

        try {
            if (authService.isAdmin(nombreUsuario, contrasenia)) {
                return ResponseEntity.status(HttpStatus.OK).body("Admin logueado");
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales incorrectas");
            }
        } catch (UsuarioNoEncontradoException userNotFoundException) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(userNotFoundException.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}

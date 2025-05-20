package com.example.tsigback.controller;

import com.example.tsigback.exception.UsuarioNoEncontradoException;
import com.example.tsigback.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    public AuthService authService;

    @PostMapping("/login/{nombreUsuario}/{contrasenia}")
    public ResponseEntity<String> login(@PathVariable String nombreUsuario, @PathVariable String contrasenia) {

        if (nombreUsuario == null || contrasenia == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Nombre de usuario o contraseña son incorrectos");
        }

        try {
            if (authService.isAdmin(nombreUsuario, contrasenia)) {
                return ResponseEntity.status(HttpStatus.OK).body("Admin logueado");
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Nombre de usuario o contraseña son incorrectos");
            }
        } catch (UsuarioNoEncontradoException userNotFoundException) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(userNotFoundException.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }

    }

}

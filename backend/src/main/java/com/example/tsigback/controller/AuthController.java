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
import com.example.tsigback.entities.dtos.UserDTO;

// DTO for login response
class LoginResponse {
    public String token;
    public UserDTO user;

    public LoginResponse(String token, UserDTO user) {
        this.token = token;
        this.user = user;
    }
}

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    public AuthService authService;

    @PostMapping("/login/{nombreUsuario}/{contrasenia}")
    public ResponseEntity<?> login(@PathVariable String nombreUsuario, @PathVariable String contrasenia) {

        if (nombreUsuario == null || contrasenia == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Nombre de usuario o contraseña son incorrectos");
        }

        try {
            if (authService.isAdmin(nombreUsuario, contrasenia)) {
                String token = java.util.UUID.randomUUID().toString();
                UserDTO user = new UserDTO(nombreUsuario, true);
                LoginResponse response = new LoginResponse(token, user);
                return ResponseEntity.status(HttpStatus.OK).body(response);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Nombre de usuario o contraseña son incorrectos");
            }
        } catch (UsuarioNoEncontradoException userNotFoundException) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(userNotFoundException.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }

    }

}

package com.example.tsigback.service;

import com.example.tsigback.entities.Usuario;
import com.example.tsigback.exception.UsuarioNoEncontradoException;
import com.example.tsigback.repository.AuthRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private AuthRepository authRepository;

    public boolean isAdmin(String nombreUsuario, String contrasenia) throws UsuarioNoEncontradoException {
        Usuario user = authRepository.findByNombreUsuarioAndContrasenia(nombreUsuario, contrasenia);
        if (user == null ) {
            throw new UsuarioNoEncontradoException("User not found");
        }
        return user.getRol().toLowerCase().equals("admin");
    }
}

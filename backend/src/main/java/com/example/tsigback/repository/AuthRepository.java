package com.example.tsigback.repository;

import com.example.tsigback.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthRepository extends JpaRepository<Usuario, String> {

    Usuario findByNombreUsuarioAndContrasenia(String nombreUsuario, String contrasenia);
}

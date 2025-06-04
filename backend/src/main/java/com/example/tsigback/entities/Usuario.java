package com.example.tsigback.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class Usuario {

    @Id
    private String nombreUsuario;
    private String contrasenia;
    private String email;
    private String rol;
    
}

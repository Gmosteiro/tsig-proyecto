package com.example.tsigback.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ParadaLinea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "id_parada", nullable = false)
    private Parada parada;

    @ManyToOne
    @JoinColumn(name = "id_linea", nullable = false)
    private Linea linea;

    private LocalTime horario;

    private boolean deshabilitado;
}
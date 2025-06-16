package com.example.tsigback.entities;

import java.util.List;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ParadaLinea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(optional = false)
    private Linea linea;

    @ManyToOne(optional = false)
    private Parada parada;

    @Column(nullable = false)
    private boolean estaHabilitada = true;

    @OneToMany(mappedBy = "paradaLinea",
               cascade = CascadeType.ALL,
               orphanRemoval = true)
    private List<HorarioParadaLinea> horarios;
}
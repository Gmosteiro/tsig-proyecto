package com.example.tsigback.entities;

import com.example.tsigback.entities.enums.EstadoParada;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.locationtech.jts.geom.Point;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
public class Parada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(columnDefinition = "geometry(Point,4326)", nullable = false)
    private Point ubicacion;

    private String nombre;
    private EstadoParada estado;
    private boolean refugio;
    private String observacion;
}
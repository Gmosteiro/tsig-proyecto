package com.example.tsigback.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.MultiPoint;

import jakarta.persistence.Column;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Linea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String descripcion;
    private String empresa;
    private String origen;
    private String destino;
    private String observacion;

    @Column(columnDefinition = "geometry(MultiPoint, 4326)")
    private MultiPoint puntos;

    @Column(columnDefinition = "geometry(LineString, 4326)")
    private LineString recorrido;
}
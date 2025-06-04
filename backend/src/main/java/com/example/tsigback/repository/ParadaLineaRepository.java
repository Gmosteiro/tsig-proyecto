package com.example.tsigback.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.tsigback.entities.ParadaLinea;

@Repository
public interface ParadaLineaRepository extends JpaRepository<ParadaLinea, Integer> {

}
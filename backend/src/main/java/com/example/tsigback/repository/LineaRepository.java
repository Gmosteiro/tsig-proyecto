package com.example.tsigback.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.tsigback.entities.Linea;

@Repository
public interface LineaRepository extends JpaRepository<Linea, Integer> {

}

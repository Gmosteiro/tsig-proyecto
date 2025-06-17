package com.example.tsigback.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.tsigback.entities.ParadaLinea;

import jakarta.transaction.Transactional;

public interface ParadaLineaRepository extends JpaRepository<ParadaLinea, Integer> {
    
    @Modifying
    @Transactional
    @Query("UPDATE ParadaLinea pl SET pl.estaHabilitada = false WHERE pl.parada.id = :paradaId")
    void deshabilitarPorParadaId(@Param("paradaId") int paradaId);

    List<ParadaLinea> findByParadaId(int paradaId);

    List<ParadaLinea> findByLineaId(int lineaId);

    List<ParadaLinea> findByParadaIdAndEstaHabilitadaTrue(int paradaId);

    List<ParadaLinea> findByParadaIdOrderByIdAsc(int paradaId);

    ParadaLinea findByParadaIdAndLineaId(int paradaId, int lineaId);
}

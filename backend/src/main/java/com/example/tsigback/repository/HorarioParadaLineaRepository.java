package com.example.tsigback.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.tsigback.entities.HorarioParadaLinea;
import com.example.tsigback.entities.ParadaLinea;

public interface HorarioParadaLineaRepository extends JpaRepository<HorarioParadaLinea, Integer> {
    List<HorarioParadaLinea> findByParadaLinea(ParadaLinea paradaLinea);
}

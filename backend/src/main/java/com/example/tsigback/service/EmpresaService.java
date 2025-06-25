package com.example.tsigback.service;

import com.example.tsigback.entities.Empresa;
import com.example.tsigback.repository.EmpresaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmpresaService {

    @Autowired
    private EmpresaRepository empresaRepository;

    public List<Empresa> getEmpresas() {
        return empresaRepository.findAll();
    }
}
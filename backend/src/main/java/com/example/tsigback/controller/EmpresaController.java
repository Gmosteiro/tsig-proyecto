package com.example.tsigback.controller;

import com.example.tsigback.entities.Empresa;
import com.example.tsigback.service.EmpresaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/empresa")
public class EmpresaController {

    @Autowired
    private EmpresaService empresaService;

    @GetMapping
    public ResponseEntity<List<Empresa>> getEmpresas() {
        return ResponseEntity.ok(empresaService.getEmpresas());
    }
}
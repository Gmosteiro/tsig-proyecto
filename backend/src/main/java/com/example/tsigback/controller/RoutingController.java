package com.example.tsigback.controller;

import com.example.tsigback.entities.dtos.RoutingRequestDTO;
import com.example.tsigback.service.RoutingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/routing")
public class RoutingController {

    @Autowired
    private RoutingService routingService;

    @PostMapping("/shortest-path")
    public ResponseEntity<?> getShortestPath(@RequestBody RoutingRequestDTO request) {
        try {
            String geojson = routingService.calculateRouteGeoJSON(request);
            return ResponseEntity.ok(geojson);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Internal error");
        }
    }
}
package com.example.tsigback.service;

import com.example.tsigback.entities.dtos.RoutingRequestDTO;
import com.example.tsigback.repository.RoutingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RoutingService {

    private static final double MAX_DIST = 100.0; // meters

    @Autowired
    private RoutingRepository routingRepository;

    public String calculateRouteGeoJSON(RoutingRequestDTO request) {
        if (request.getPoints() == null || request.getPoints().size() < 2) {
            throw new IllegalArgumentException("At least two points are required.");
        }

        List<Long> nodeIds = new ArrayList<>();
        for (RoutingRequestDTO.PointDTO pt : request.getPoints()) {
            Long nodeId = routingRepository.findNearestSourceNode(pt.getLon(), pt.getLat());
            Double dist = routingRepository.findNearestDistance(pt.getLon(), pt.getLat());
            if (dist > MAX_DIST) {
                throw new IllegalArgumentException("One or more points are more than 100 meters from the route.");
            }
            nodeIds.add(nodeId);
        }

        return routingRepository.calculateRouteGeoJSON(nodeIds);
    }
}
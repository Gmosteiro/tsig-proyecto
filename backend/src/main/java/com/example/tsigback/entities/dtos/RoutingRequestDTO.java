package com.example.tsigback.entities.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RoutingRequestDTO {
    private List<PointDTO> points;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PointDTO {
        private double lat;
        private double lon;
    }
}
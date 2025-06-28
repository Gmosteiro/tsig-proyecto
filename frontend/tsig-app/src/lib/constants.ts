export const API_URL = "https://api.example.com";
export const WMS_URL = "http://localhost:8080/geoserver/wms";

// Configuraciones optimizadas para WMS - TILES MÁS GRANDES para reducir requests
export const DEFAULT_TILE_SIZE = 512; // Aumentado de 256 a 512 para reducir requests
export const WMS_VERSION = "1.1.1"; // Versión WMS más estable
export const WMS_FORMAT = "image/png"; // Formato optimizado con transparencia
export const WMS_MAX_FEATURES = 50; // Límite de features para GetFeatureInfo
export const WMS_TIMEOUT = 15000; // Aumentado timeout a 15 segundos
export const WMS_BUFFER = 64; // Buffer para tiles en píxeles

// Configuraciones de cache y performance
export const WMS_TILE_CACHE = true;
export const WMS_UPDATE_INTERVAL = 60000; // Intervalo de actualización de tiles en ms

// Configuraciones específicas por zoom para optimizar performance
export const ZOOM_CONFIG = {
    // Zoom bajo - tiles grandes, menos requests
    LOW: { min: 1, max: 10, tileSize: 512, maxFeatures: 15 },
    // Zoom medio - balance entre detalle y performance  
    MEDIUM: { min: 11, max: 14, tileSize: 512, maxFeatures: 30 },
    // Zoom alto - mantener calidad pero limitar features
    HIGH: { min: 15, max: 18, tileSize: 512, maxFeatures: 50 }
};

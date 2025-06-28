# Optimizaciones de Performance WMS - TSIG

## ⚠️ SOLUCION PARA ERROR 429 (Too Many Requests)

### Problema Identificado
El error 429 "Too Many Requests" ocurre cuando el frontend hace demasiados requests simultáneos a GeoServer, sobrecargando el servidor.

### Soluciones Implementadas

#### 1. **Tiles Más Grandes = Menos Requests**
- **Tamaño de tiles**: 256px → **512px** (75% menos requests)
- **DPI reducido**: 96 → **72** (archivos más livianos)
- **Compresión**: DEFLATE habilitada
- **Buffer**: 64 píxeles para mejor caching

#### 2. **Control de Flujo Optimizado** (controlflow.properties)
```properties
# Límites aumentados para evitar 429
ows.global=200                 # Era 100
ows.wms.getmap=50             # Era 10  
user.ows.wms.getmap=100/s     # Era 30/s
timeout=120                    # Era 60s
ip=30                         # Era 10
```

#### 3. **Timeouts Aumentados**
- **WMS Frontend**: 10s → **15s**
- **WMS Rendering**: 30s → **45s**
- **Backend Timeout**: 120s → **300s**

#### 4. **Docker Optimizado**
- **CPU**: 2.0 → **2.5 cores**
- **Paralelismo JVM**: 8 threads
- **Configuraciones adicionales** para manejo de requests

## Script de Aplicación Rápida

```powershell
# Para aplicar SOLO las optimizaciones del error 429:
.\fix-429-error.ps1

# Para optimización completa:
.\optimize-docker.ps1
```

## Resumen de Optimizaciones Anteriores

### 1. Docker y GeoServer
- **Memoria aumentada**: 3GB máximo para GeoServer (antes sin límite)
- **JVM optimizado**: Usar G1GC, ajustes de pausa y concurrencia
- **Recursos de contenedor**: Límites de CPU y memoria específicos
- **Timezone**: Configurado para Uruguay

### 2. Configuración WMS (wms.xml)
- **Cache habilitado**: 5000 entradas, 500KB por entrada
- **Timeouts**: 45 segundos máximo de rendering
- **Memoria de request**: 512MB máximo
- **Buffer optimizado**: 64 píxeles
- **Interpolación**: Cambiado a Bilinear para mejor calidad

### 3. GeoWebCache (geowebcache.xml)  
- **Backend timeout**: Aumentado a 5 minutos (300s)
- **Cache de tiles**: Optimizado para Docker

### 4. Frontend Optimizado
- **Timeouts WMS**: 15 segundos máximo
- **AbortController**: Cancelación de requests pendientes
- **Parámetros optimizados**: TILED=true, FORMAT_OPTIONS optimizados
- **Cache local**: Configuraciones mejoradas
- **Throttling**: Hook para limitar requests concurrentes

### 5. Constantes de Performance
```typescript
export const DEFAULT_TILE_SIZE = 512; // Reducir requests
export const WMS_TIMEOUT = 15000; // 15 segundos
export const WMS_MAX_FEATURES = 50; // Máximo features por request
export const WMS_BUFFER = 64; // Buffer para caching
```

## Cómo Usar las Optimizaciones

### Opción 1: Solo Error 429 (Recomendado)
```powershell
# Más rápido, solo aplica cambios para error 429
.\fix-429-error.ps1
```

### Opción 2: Optimización Completa
```powershell
# Aplica todas las optimizaciones
.\optimize-docker.ps1
```

### Opción 3: Manual
```bash
# 1. Parar contenedores
docker-compose down

# 2. Limpiar Docker
docker system prune -f

# 3. Reconstruir e iniciar
docker-compose up -d --build
```

## Configuraciones Específicas por Zoom

El sistema ahora ajusta automáticamente el número de features según el zoom:
- **Zoom 1-10**: 15 features máximo (vista general, tiles 512px)
- **Zoom 11-14**: 30 features máximo (vista intermedia, tiles 512px) 
- **Zoom 15-18**: 50 features máximo (vista detallada, tiles 512px)

## Monitoreo del Error 429

### Verificar si persiste el error:
```bash
# Ver logs de GeoServer
docker-compose logs --tail=50 geoserver | findstr "429"

# Ver requests activos
docker stats geoserver
```

### Señales de mejora:
- ✅ No aparecen errores 429 en logs
- ✅ Tiles cargan más rápido
- ✅ Menos cuadrados blancos en el mapa
- ✅ Navegación más fluida

## Troubleshooting

### Si siguen los errores 429:
1. **Aumentar más el tamaño de tiles:**
   ```typescript
   // En constants.ts
   export const DEFAULT_TILE_SIZE = 1024; // Aún menos requests
   ```

2. **Reducir features simultáneos:**
   ```properties
   # En controlflow.properties
   ows.wms.getmap=25  # Reducir de 50 a 25
   ```

3. **Implementar throttling adicional:**
   ```typescript
   // Usar useWMSThrottle en componentes que hacen requests
   const { throttledRequest } = useWMSThrottle(2, 200); // Max 2 concurrent, 200ms delay
   ```

### Si las capas no cargan:
1. Verificar memoria del sistema: debe tener 16GB+ disponibles
2. Limpiar cache del navegador completamente
3. Verificar red: `docker-compose ps`
4. Reiniciar solo GeoServer: `docker-compose restart geoserver`

### Si el rendimiento sigue lento:
1. Considerar usar SSD en lugar de HDD
2. Cerrar aplicaciones que usen mucha RAM
3. Aumentar la memoria de Docker Desktop
4. Reducir el zoom inicial del mapa

## Archivos de Configuración Modificados para Error 429

### Nuevos archivos:
- `fix-429-error.ps1` - Script específico para error 429
- `frontend/tsig-app/src/hooks/useWMSThrottle.ts` - Throttling de requests

### Archivos modificados:
- `docker-compose.yml` - CPU aumentado, configuraciones JVM
- `geoserver_data/controlflow.properties` - Límites de requests aumentados
- `geoserver_data/wms.xml` - Timeouts y configuración optimizada
- `frontend/tsig-app/src/lib/constants.ts` - Tiles 512px, timeouts 15s
- `frontend/tsig-app/src/components/map/LayerController.tsx` - DPI 72, compresión

## Archivos de Configuración Modificados (Anteriores)

- `docker-compose.yml` - Configuración de contenedores optimizada
- `geoserver_data/wms.xml` - Configuración WMS optimizada  
- `geoserver_data/gwc/geowebcache.xml` - Cache optimizado
- `frontend/tsig-app/src/lib/constants.ts` - Constantes de performance
- `frontend/tsig-app/src/components/map/LayerController.tsx` - Capas optimizadas
- `frontend/tsig-app/src/components/map/WMSFeatureInfoHandler.tsx` - Timeouts y cancelación

## Backups Creados

Los archivos originales están respaldados con extensión `.backup`:
- `geoserver_data/global.xml.backup`
- `geoserver_data/wms.xml.backup`  
- `geoserver_data/gwc/geowebcache.xml.backup`
- `geoserver_data/controlflow.properties.backup` (automático)

Para restaurar configuración original:
```powershell
copy geoserver_data\wms.xml.backup geoserver_data\wms.xml
copy geoserver_data\gwc\geowebcache.xml.backup geoserver_data\gwc\geowebcache.xml
copy geoserver_data\controlflow.properties.backup geoserver_data\controlflow.properties
```

## Resultados Esperados

Después de aplicar estas optimizaciones deberías ver:

1. **75% menos requests** (tiles 512px vs 256px)
2. **Sin errores 429** en logs de GeoServer
3. **Carga más rápida** de tiles
4. **Navegación más fluida** en el mapa
5. **Menos cuadrados blancos** o tiles faltantes

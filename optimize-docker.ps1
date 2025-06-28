# Script de optimización de Docker para TSIG
Write-Host "=== Script de Optimización Docker TSIG ===" -ForegroundColor Green

# 1. Parar contenedores
Write-Host "Parando contenedores..." -ForegroundColor Yellow
docker-compose down

# 2. Limpiar cache de Docker
Write-Host "Limpiando cache de Docker..." -ForegroundColor Yellow
docker system prune -f

# 3. Eliminar volúmenes sin usar
Write-Host "Limpiando volúmenes..." -ForegroundColor Yellow
docker volume prune -f

# 4. Limpiar imágenes sin usar
Write-Host "Limpiando imágenes sin usar..." -ForegroundColor Yellow
docker image prune -f

# 5. Reconstruir solo GeoServer para aplicar cambios de configuración
Write-Host "Reconstruyendo GeoServer con configuración optimizada..." -ForegroundColor Yellow
docker-compose build --no-cache geoserver

# 6. Iniciar servicios en orden optimizado
Write-Host "Iniciando servicios..." -ForegroundColor Yellow
docker-compose up -d postgis
Start-Sleep -Seconds 10

docker-compose up -d geoserver
Start-Sleep -Seconds 15

docker-compose up -d backend
Start-Sleep -Seconds 5

docker-compose up -d frontend

# 7. Verificar estado de servicios
Write-Host "Verificando estado de servicios..." -ForegroundColor Yellow
docker-compose ps

# 8. Mostrar logs de GeoServer para verificar inicio
Write-Host "Mostrando logs de GeoServer (últimas 20 líneas)..." -ForegroundColor Yellow
docker-compose logs --tail=20 geoserver

Write-Host "=== Optimización completada ===" -ForegroundColor Green
Write-Host "Configuraciones aplicadas:" -ForegroundColor Cyan
Write-Host "- GeoServer: Memoria aumentada (3GB max), timeouts optimizados" -ForegroundColor White
Write-Host "- WMS: Cache habilitado, límites de rendering optimizados" -ForegroundColor White
Write-Host "- GeoWebCache: Timeout del backend aumentado a 5 minutos" -ForegroundColor White
Write-Host "- Frontend: Configuraciones WMS optimizadas con timeouts y cache" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "La aplicación debería estar disponible en:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- GeoServer: http://localhost:8080/geoserver" -ForegroundColor White
Write-Host "- Backend API: http://localhost:8081" -ForegroundColor White

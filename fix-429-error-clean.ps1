# Script de optimizacion especifico para error 429 (Too Many Requests)
Write-Host "=== Optimizacion para Error 429 - Too Many Requests ===" -ForegroundColor Green

# 1. Parar contenedores
Write-Host "Parando contenedores..." -ForegroundColor Yellow
docker-compose down

# 2. Mostrar resumen de cambios aplicados
Write-Host "Cambios aplicados para resolver error 429:" -ForegroundColor Cyan
Write-Host "[OK] Tamano de tiles aumentado: 256px -> 512px (75 por ciento menos requests)" -ForegroundColor Green
Write-Host "[OK] Control de flujo optimizado: limites de requests aumentados" -ForegroundColor Green
Write-Host "[OK] Timeout WMS aumentado: 10s -> 15s" -ForegroundColor Green
Write-Host "[OK] Buffer de tiles aumentado: 0px -> 64px" -ForegroundColor Green
Write-Host "[OK] DPI reducido: 96 -> 72 (tiles mas livianos)" -ForegroundColor Green
Write-Host "[OK] Compresion DEFLATE habilitada" -ForegroundColor Green
Write-Host "[OK] CPU del contenedor aumentado: 2.0 -> 2.5" -ForegroundColor Green
Write-Host ""

# 3. Limpiar cache de Docker
Write-Host "Limpiando cache de Docker..." -ForegroundColor Yellow
docker system prune -f

# 4. Iniciar servicios en orden optimizado con delays mas largos
Write-Host "Iniciando servicios con delays optimizados..." -ForegroundColor Yellow

Write-Host "Iniciando PostGIS..." -ForegroundColor Gray
docker-compose up -d postgis
Start-Sleep -Seconds 15

Write-Host "Iniciando GeoServer con configuracion optimizada..." -ForegroundColor Gray
docker-compose up -d geoserver
Write-Host "Esperando a que GeoServer este completamente listo..." -ForegroundColor Gray
Start-Sleep -Seconds 30

Write-Host "Iniciando Backend..." -ForegroundColor Gray
docker-compose up -d backend
Start-Sleep -Seconds 10

Write-Host "Iniciando Frontend..." -ForegroundColor Gray
docker-compose up -d frontend
Start-Sleep -Seconds 5

# 5. Verificar estado de servicios
Write-Host "Verificando estado de servicios..." -ForegroundColor Yellow
docker-compose ps

# 6. Mostrar informacion de configuracion
Write-Host ""
Write-Host "=== Configuracion optimizada para reducir requests ===" -ForegroundColor Cyan
Write-Host "Control de flujo (controlflow.properties):" -ForegroundColor White
Write-Host "- Limite global: 100 -> 200 requests" -ForegroundColor Green
Write-Host "- WMS GetMap: 10 -> 50 requests concurrentes" -ForegroundColor Green
Write-Host "- Por usuario: 30/s -> 100/s requests" -ForegroundColor Green
Write-Host "- Timeout: 60s -> 120s" -ForegroundColor Green
Write-Host ""
Write-Host "Configuracion de tiles:" -ForegroundColor White
Write-Host "- Tamano: 512x512 pixeles (antes 256x256)" -ForegroundColor Green
Write-Host "- DPI: 72 (reduce tamano de archivo)" -ForegroundColor Green
Write-Host "- Compresion: DEFLATE habilitada" -ForegroundColor Green
Write-Host "- Buffer: 64 pixeles para mejor cache" -ForegroundColor Green

# 7. Verificar logs de GeoServer
Write-Host ""
Write-Host "Verificando logs de GeoServer..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker-compose logs --tail=10 geoserver

Write-Host ""
Write-Host "=== Optimizacion completada ===" -ForegroundColor Green
Write-Host "El sistema ahora deberia manejar mejor la carga y evitar errores 429." -ForegroundColor White
Write-Host "Si siguen los problemas, considera:" -ForegroundColor Yellow
Write-Host "1. Aumentar aun mas el tamano de tiles a 1024px" -ForegroundColor White
Write-Host "2. Reducir el zoom inicial del mapa" -ForegroundColor White
Write-Host "3. Implementar throttling en el frontend" -ForegroundColor White
Write-Host ""
Write-Host "Aplicacion disponible en: http://localhost:3000" -ForegroundColor Cyan

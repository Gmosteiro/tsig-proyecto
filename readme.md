# TSIG Proyecto

App web compuesta por:

-   Frontend en **React (Vite)**
-   Backend en **Spring Boot**
-   Base de datos **PostGIS**
-   Servicio de mapas con **GeoServer**

# Para levantar el proyecto

1. Clonar el repositorio
   git clone <url-del-repo>
   cd tsig-proyecto

docker-compose up --build

# Scripts para inicializar

docker exec -i tsig-proyecto-postgis-1 psql -U gisuser -d gisdb < backend/scripts/postgis/ft_departamentos.sql
docker exec -i tsig-proyecto-postgis-1 psql -U gisuser -d gisdb < backend/scripts/postgis/ft_caminera_nacional.sql
docker exec -i tsig-proyecto-postgis-1 psql -U gisuser -d gisdb < backend/scripts/postgis/ft_caminera_nacional_edges.sql
docker exec -i tsig-proyecto-postgis-1 psql -U gisuser -d gisdb < backend/scripts/postgis/ft_postes.sql
docker exec -i tsig-proyecto-postgis-1 psql -U gisuser -d gisdb < backend/scripts/postgis/usuario.sql
bash backend/scripts/geoserver/geoserver-setup.sh

((Para la capa de lineas, hay que modificar la configuración en GeoServer directamente))

# Servicio | URL | User | Password

Frontend http://localhost:3000
Backend API | http://localhost:8081
PostGIS localhost:5433 → DB: gisdb | gisuser | secret
GeoServer http://localhost:8080/geoserver | admin | geoserver

# Detener contenedores

docker-compose down

# Eliminar volúmenes

En vez
docker-compose down -v

# logs

docker logs tsig-proyecto-frontend-1

# Cómo persistir la configuración de GeoServer

./geoserver_backup_restore.sh

# Error de permisos:

chmod +x geoserver_backup_restore.sh

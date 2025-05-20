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

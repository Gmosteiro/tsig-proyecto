#!/bin/bash
# filepath: ./geoserver_backup_restore.sh

set -e

SERVICE_NAME="geoserver"
BACKUP_DIR="./geoserver_data_backup"

# Obtener el container ID de GeoServer
CONTAINER_ID=$(docker-compose ps -q $SERVICE_NAME)

if [ -z "$CONTAINER_ID" ]; then
  echo "GeoServer container not running. Inicia con: docker-compose up -d geoserver"
  exit 1
fi

echo "1. Realizando backup de /opt/geoserver/data_dir..."
docker cp $CONTAINER_ID:/opt/geoserver/data_dir $BACKUP_DIR

echo "Backup guardado en $BACKUP_DIR"

echo "2. ¿Deseas restaurar el backup en el volumen actual? (s/n)"
read RESP
if [ "$RESP" = "s" ]; then
  echo "Copiando backup al volumen del contenedor..."
  docker cp $BACKUP_DIR/. $CONTAINER_ID:/opt/geoserver/data_dir
  echo "Reiniciando GeoServer..."
  docker restart $CONTAINER_ID
  echo "Restauración completada."
else
  echo "Solo se realizó el backup."
fi
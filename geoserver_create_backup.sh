#!/bin/bash
# filepath: ./geoserver_create_backup.sh

set -e

SERVICE_NAME="geoserver"
BACKUP_DIR="./geoserver_data_backup"
WORKSPACES_BACKUP="$BACKUP_DIR/workspaces"

# Obtener el container ID de GeoServer
CONTAINER_ID=$(docker-compose ps -q $SERVICE_NAME)

if [ -z "$CONTAINER_ID" ]; then
  echo "GeoServer container not running. Inicia con: docker-compose up -d geoserver"
  exit 1
fi

echo "1. Realizando backup de /opt/geoserver/data_dir/workspaces..."
mkdir -p "$WORKSPACES_BACKUP"
docker cp $CONTAINER_ID:/opt/geoserver/data_dir/workspaces/. "$WORKSPACES_BACKUP"

echo "Backup de workspaces guardado en $WORKSPACES_BACKUP"

echo "2. ¿Deseas restaurar el backup de workspaces en el volumen actual? (s/n)"
read RESP
if [ "$RESP" = "s" ]; then
  echo "Copiando backup de workspaces al volumen del contenedor..."
  docker cp "$WORKSPACES_BACKUP/." $CONTAINER_ID:/opt/geoserver/data_dir/workspaces
  echo "Reiniciando GeoServer..."
  docker restart $CONTAINER_ID
  echo "Restauración de workspaces completada."
else
  echo "Solo se realizó el backup de workspaces."
fi
#!/bin/bash
# filepath: ./geoserver_apply_backup.sh

set -e

SERVICE_NAME="geoserver"
BACKUP_DIR="./geoserver_data_backup"

# Obtener el container ID de GeoServer
CONTAINER_ID=$(docker-compose ps -q $SERVICE_NAME)

if [ -z "$CONTAINER_ID" ]; then
  echo "GeoServer container not running. Inicia con: docker-compose up -d geoserver"
  exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
  echo "No existe el directorio $BACKUP_DIR con el backup a aplicar."
  exit 1
fi

echo "Aplicando backup de $BACKUP_DIR al contenedor..."
docker cp $BACKUP_DIR/. $CONTAINER_ID:/opt/geoserver/data_dir

echo "Reiniciando GeoServer..."
docker restart $CONTAINER_ID

echo "Backup aplicado correctamente."
# Variables
GEOSERVER_URL="http://localhost:8080/geoserver/rest"
USER="admin"
PASS="geoserver"

# 1. Crear workspace si no existe
if ! curl -s -u $USER:$PASS -o /dev/null -w "%{http_code}" "$GEOSERVER_URL/workspaces/tsig.xml" | grep -q "200"; then
  curl -u $USER:$PASS -XPOST -H "Content-type: text/xml" \
    -d "<workspace><name>tsig</name></workspace>" \
    "$GEOSERVER_URL/workspaces"
fi

# 2. Crear datastore (PostGIS) si no existe
if ! curl -s -u $USER:$PASS -o /dev/null -w "%{http_code}" "$GEOSERVER_URL/workspaces/tsig/datastores/tsig_postgis.xml" | grep -q "200"; then
  curl -u $USER:$PASS -XPOST -H "Content-type: text/xml" \
    -d "<dataStore>
          <name>tsig_postgis</name>
          <connectionParameters>
            <host>postgis</host>
            <port>5432</port>
            <database>gisdb</database>
            <user>gisuser</user>
            <passwd>secret</passwd>
            <dbtype>postgis</dbtype>
          </connectionParameters>
        </dataStore>" \
    "$GEOSERVER_URL/workspaces/tsig/datastores"
fi

# 3. Publicar capa (featuretype) existente en PostGIS si no existe
if ! curl -s -u $USER:$PASS -o /dev/null -w "%{http_code}" "$GEOSERVER_URL/layers/tsig:ft_caminera_nacional.xml" | grep -q "200"; then
  curl -u $USER:$PASS -XPOST -H "Content-type: text/xml" \
    -d "<featureType><name>ft_caminera_nacional</name></featureType>" \
    "$GEOSERVER_URL/workspaces/tsig/datastores/tsig_postgis/featuretypes"
fi

# 4. Publicar capa "parada" si no existe
if ! curl -s -u $USER:$PASS -o /dev/null -w "%{http_code}" "$GEOSERVER_URL/layers/tsig:parada.xml" | grep -q "200"; then
  curl -u $USER:$PASS -XPOST -H "Content-type: text/xml" \
    -d "<featureType><name>parada</name></featureType>" \
    "$GEOSERVER_URL/workspaces/tsig/datastores/tsig_postgis/featuretypes"
fi

# 4. Publicar capa "linea" si no existe
if ! curl -s -u $USER:$PASS -o /dev/null -w "%{http_code}" "$GEOSERVER_URL/layers/tsig:linea.xml" | grep -q "200"; then
  curl -u $USER:$PASS -XPOST -H "Content-type: text/xml" \
    -d "<featureType><name>linea</name></featureType>" \
    "$GEOSERVER_URL/workspaces/tsig/datastores/tsig_postgis/featuretypes"
fi
# Variables
GEOSERVER_URL="http://geoserver:8080/geoserver/rest"
USER="admin"
PASS="geoserver"

# 1. Crear workspace
curl -u $USER:$PASS -XPOST -H "Content-type: text/xml" \
  -d "<workspace><name>tsig</name></workspace>" \
  "$GEOSERVER_URL/workspaces"

# 2. Crear datastore (PostGIS)
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

# 3. Publicar capa (featuretype) existente en PostGIS
curl -u $USER:$PASS -XPOST -H "Content-type: text/xml" \
  -d "<featureType><name>ft_caminera_nacional</name></featureType>" \
  "$GEOSERVER_URL/workspaces/tsig/datastores/tsig_postgis/featuretypes"
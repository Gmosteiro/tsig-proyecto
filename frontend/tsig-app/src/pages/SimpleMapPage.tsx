import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import NavigationBar from '../components/ui/NavigationBar';
import Footer from '../components/ui/Footer';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { getWMSFeatureInfo } from '../services/api';
import { LineaDTO, updateGeoJSON, getLinesByGeoJson } from '../services/linea';
import Searcher from '../components/search/Searcher';
import PolygonDrawControl from '../components/map/PolygonDrawControl';
import React from 'react';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const stopIcon = new L.Icon({
  iconUrl: '/images/marker-bus.png',
  iconSize: [25, 25],
  iconAnchor: [12, 41],
});

export default function SimpleMapPage() {
  const [position, setPosition] = useState<[number, number]>([-34.9, -56.2]);
  const [nearbyStops, setNearbyStops] = useState<any[]>([]);
  const [nearbyLines, setNearbyLines] = useState<any[]>([]);
  const [selectedLinea, setSelectedLinea] = useState<any | null>(null);
  const [showSearcher, setShowSearcher] = useState(false);
  const [polygonCoords, setPolygonCoords] = useState<[number, number][]>([]);
  const [polygonLines, setPolygonLines] = useState<any[] | null>(null);
  const [drawingPolygon, setDrawingPolygon] = useState(false);
  const mapRef = useRef<any>(null);
  const featureGroupRef = useRef<any>(null);

  useEffect(() => {
    if (selectedLinea && selectedLinea.rutaGeoJSON && mapRef.current) {
      const geojson = JSON.parse(selectedLinea.rutaGeoJSON)
      const coords = geojson.coordinates.flat(1)
      const latlngs = coords.map(([lng, lat]: [number, number]) => [lat, lng])
      if (latlngs.length > 0) {
        mapRef.current.fitBounds(latlngs)
      }
    }
  }, [selectedLinea]);

  const handleCancelPolygon = () => {
    setDrawingPolygon(false)
    setPolygonLines(null)
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers()
    }
    setPolygonCoords([])
  }

  function SetMapRef({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
    const map = useMap();
    React.useEffect(() => {
      mapRef.current = map;
    }, [map, mapRef]);
    return null;
  }

  const handleCreated = async (e: any) => {
    if (e.layerType === 'polygon') {
      const latlngs = e.layer.getLatLngs()[0].map((latlng: any) => [latlng.lat, latlng.lng]);
      setPolygonCoords(latlngs);

      const geoJson = e.layer.toGeoJSON();

      const lines = await getLinesByGeoJson(geoJson);
      setPolygonLines(lines);
      setShowSearcher(false); // Oculta el buscador normal si está abierto
      setDrawingPolygon(false); // Ya no estamos dibujando

      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
      }
      setPolygonCoords([]);
    }
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(latlng);

        // Consulta WMS de paradas cercanas
        const mapSize = { x: 1024, y: 768 };
        const tolerance = 4000; // METROS de visualizacion de PARADAS y LINES alrededor de ubicaion actual
        const featureCount = 200;

        const data = await getWMSFeatureInfo({
          layerName: "tsig:parada",
          crsCode: "EPSG:4326",
          bbox: `${latlng[1] - 0.01},${latlng[0] - 0.01},${latlng[1] + 0.01},${latlng[0] + 0.01}`,
          size: mapSize,
          point: { x: mapSize.x / 2, y: mapSize.y / 2 },
          infoFormat: "application/json",
          tolerance,
          featureCount
        });

        console.log("WMS paradas:", data);

        if (data && data.features) {
          setNearbyStops(data.features);
        } else {
          setNearbyStops([]);
        }


        // Consulta WMS de líneas cercanas
        const linesData = await getWMSFeatureInfo({
          layerName: "tsig:linea",
          crsCode: "EPSG:4326",
          bbox: `${latlng[1] - 0.01},${latlng[0] - 0.01},${latlng[1] + 0.01},${latlng[0] + 0.01}`,
          size: mapSize,
          point: { x: mapSize.x / 2, y: mapSize.y / 2 },
          infoFormat: "application/json",
          tolerance,
          featureCount
        });

        console.log("WMS lineas:", linesData);

        if (linesData && linesData.features) {
          setNearbyLines(linesData.features);
        } else {
          setNearbyLines([]);
        }

      },
      (err) => {
        console.error("Error obteniendo geolocalización:", err);
      }
    );
  }, []);

  return (
    <div className="min-h-screen">
      <NavigationBar />

      <div className="flex justify-center my-6">
        {(showSearcher || polygonLines) && (
          <Searcher
            onVerLinea={async (data: LineaDTO) => {
              const line = await updateGeoJSON(data);
              setSelectedLinea(line);
              setShowSearcher(false);
              setPolygonLines(null);
            }}
            initialLines={polygonLines}
          />
        )}
      </div>

      {!drawingPolygon && (
        <div className="flex gap-2 justify-center my-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
            onClick={() => setShowSearcher(v => !v)}
          >
            {showSearcher ? "Ocultar Buscador" : "Buscar Rutas"}
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer"
            onClick={() => setDrawingPolygon(true)}
          >
            Filtrar por Área
          </button>
          {(showSearcher || selectedLinea || polygonLines) && (
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded cursor-pointer"
              onClick={() => {
                setShowSearcher(false);
                setSelectedLinea(null);
                setPolygonLines(null);
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      )}

      {drawingPolygon && (
        <div className="flex gap-2 justify-center my-4">
          <div className="bg-blue-100 border border-blue-300 px-4 py-2 rounded">
            <span className="text-blue-800">Dibuja un polígono en el mapa para filtrar rutas por área</span>
          </div>
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded cursor-pointer"
            onClick={handleCancelPolygon}
          >
            Cancelar
          </button>
        </div>
      )}

      {position ? (
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: '75vh', width: '100%' }}
        >
          <SetMapRef mapRef={mapRef} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={position} icon={customIcon}>
            <Popup>¡Estás aquí!</Popup>
          </Marker>

          {/* Paradas Cercanas */}
          {nearbyStops.map((feature: any, idx: number) => {
            const [lon, lat] = feature.geometry.coordinates;
            return (
              <Marker key={idx} position={[lat, lon]} icon={stopIcon}>
                {/* Popup Temporal */}
                <Popup>
                  {feature.properties?.nombre || 'Parada'}<br />
                  ID: {feature.id}
                </Popup>
              </Marker>
            );
          })}

          {/* Lineas Cercanas */}
          {nearbyLines.map((feature: any, idx: number) => (
            <GeoJSON
              key={idx}
              data={feature}
              style={{
                color: 'green',
                weight: 4,
                opacity: 0.7
              }}
            >
              <Popup>
                <strong>Linea</strong><br />
                Origen: {feature.properties?.origen}<br />
                Destino: {feature.properties?.destino}<br />
                Empresa: {feature.properties?.empresa}
              </Popup>
            </GeoJSON>
          ))}

          {/* Línea seleccionada desde el buscador */}
          {selectedLinea && selectedLinea.rutaGeoJSON && (
            <GeoJSON
              data={JSON.parse(selectedLinea.rutaGeoJSON)}
              style={{ color: 'blue', weight: 5, opacity: 0.9 }}
            />
          )}

          <PolygonDrawControl
            featureGroupRef={featureGroupRef}
            polygonCoords={polygonCoords}
            setPolygonCoords={setPolygonCoords}
            handleCreated={handleCreated}
          />

        </MapContainer>
      ) : (
        <div className="text-center text-gray-600 mt-10">Cargando ubicación...</div>
      )}

      <Footer />
    </div>
  );
}

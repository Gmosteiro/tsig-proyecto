import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON} from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import NavigationBar from '../components/ui/NavigationBar';
import Footer from '../components/ui/Footer';
import 'leaflet/dist/leaflet.css';
import { FeatureGroup, Polygon } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { getWMSFeatureInfo } from '../services/api';


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

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
}

export default function SimpleMapPage() {
  const [position, setPosition] = useState<[number, number]>([-34.9, -56.2]);
  const [nearbyStops, setNearbyStops] = useState<any[]>([]);
  const [nearbyLines, setNearbyLines] = useState<any[]>([]);
  const [polygon, setPolygon] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hideDisabled, setHideDisabled] = useState(false);


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

  const handleCreated = (e: any) => {
    if (e.layerType === 'polygon') {
      const layer = e.layer;
      const geojson = layer.toGeoJSON();
      setPolygon(geojson);
    }
  };

  const handleDeleted = () => {
    setPolygon(null);
  };

  const renderForm = () => {
    return (
      <div className="flex flex-col gap-4 p-4 bg-white shadow rounded-md w-full max-w-md mx-auto">
        {selectedOption === 'Origen-Destino' && (
          <>
            <label>Origen:</label>
            <input type="text" placeholder="Ej: Montevideo" className="border p-2 rounded" />
            <label>Destino:</label>
            <input type="text" placeholder="Ej: Maldonado" className="border p-2 rounded" />
          </>
        )}
        {selectedOption === 'Por Horario' && (
          <>
            <label>Desde:</label>
            <input type="time" className="border p-2 rounded" />
            <label>Hasta:</label>
            <input type="time" className="border p-2 rounded" />
          </>
        )}
        {selectedOption === 'Por Ruta/KM' && (
          <>
            <label>Ruta o KM:</label>
            <input type="text" placeholder="Ej: Ruta 8 km 29" className="border p-2 rounded" />
          </>
        )}
        {selectedOption === 'Por Empresa' && (
          <>
            <label>Empresa:</label>
            <input type="text" placeholder="Ej: CUTCSA" className="border p-2 rounded" />
          </>
        )}
        {selectedOption === 'Corte Polígono' && (
          <>
            <p>Dibuje un polígono en el mapa.</p>
          </>
        )}

        <div className="flex justify-between mt-4">
          <button
            onClick={() => {
              setSelectedOption(null);
              setPolygon(null);
            }}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
          >
            Volver
          </button>
          <button
            onClick={() => {
              if (selectedOption === 'Corte Polígono') {
                if (polygon) {
                  alert('GeoJSON generado:\n' + JSON.stringify(polygon, null, 2));
                } else {
                  alert('Dibuje un polígono primero.');
                }
              } else {
                alert('Confirmado (sin funcionalidad)');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <NavigationBar />

      {/* Selector o formulario */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-100 shadow">
        {!selectedOption ? (
          <>
          <div className="flex flex-wrap gap-4 justify-center flex-1">
            
            {['Origen-Destino', 'Por Horario', 'Por Ruta/KM', 'Por Empresa', 'Corte Polígono'].map((label) => (
              <button
                key={label}
                onClick={() => setSelectedOption(label)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow hover:bg-gray-50 transition"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center ml-4">
            <input
              type="checkbox"
              id="toggleHideDisabled"
              checked={hideDisabled}
              onChange={() => setHideDisabled(prev => !prev)}
              className="mr-2 scale-90"
            />
            <label htmlFor="toggleHideDisabled" className="text-sm font-small">
              Líneas y Paradas Deshabilitadas
            </label>
          </div>

          
          </>
        ) : (
        renderForm()
      )}
      </div>

      {/* Mapa */}
      {position ? (
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: '75vh', width: '100%' }}
        >
          <RecenterMap center={position} />
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



          {/* Solo mostrar el control de dibujo si está activa la opción */}
          {selectedOption === 'Corte Polígono' && (
            <FeatureGroup>
              <EditControl
                position="topright"
                onCreated={handleCreated}
                onDeleted={handleDeleted}
                draw={{
                  rectangle: false,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: false,
                  polygon: true,
                }}
              />
              {/* Mostrar el polígono si existe */}
              {polygon && (
                <Polygon positions={polygon.geometry.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]])} />
              )}
            </FeatureGroup>
          )}

          
        </MapContainer>
      ) : (
        <div className="text-center text-gray-600 mt-10">Cargando ubicación...</div>
      )}

      <Footer />
    </div>
  );
}

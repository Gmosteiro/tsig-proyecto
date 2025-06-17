import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import NavigationBar from '../components/ui/NavigationBar';
import Footer from '../components/ui/Footer';
import 'leaflet/dist/leaflet.css';
import { FeatureGroup, Polygon } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function SimpleMapPage() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [polygon, setPolygon] = useState<any>(null); // Guardar el polígono dibujado

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
      },
      (error) => {
        console.error('Error al obtener la ubicación:', error);
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
      <div className="flex justify-center p-4 bg-gray-100 shadow">
        {!selectedOption ? (
          <div className="flex flex-wrap gap-4">
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
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={position} icon={customIcon}>
            <Popup>¡Estás aquí!</Popup>
          </Marker>
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

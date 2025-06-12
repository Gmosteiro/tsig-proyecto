import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import NavigationBar from '../components/ui/NavigationBar';
import Footer from '../components/ui/Footer';
import 'leaflet/dist/leaflet.css';

// Icono personalizado (necesario porque el default no carga bien a veces)
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function SimpleMapPage() {
  const [position, setPosition] = useState<[number, number] | null>(null);

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

  return (
    <div className="min-h-screen">
      <NavigationBar />

      {position ? (
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: '100vh', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={position} icon={customIcon}>
            <Popup>¡Estás aquí!</Popup>
          </Marker>
        </MapContainer>
      ) : (
        <div className="text-center text-gray-600 mt-10">Cargando ubicación...</div>
      )}

      <Footer />
    </div>
  );
}

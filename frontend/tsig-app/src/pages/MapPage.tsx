import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import RoutingControl from '../components/map/RoutingControl';
import PointControls from '../components/map/PointsControls';
import ParadaForm from '../components/map/StopForm';
import { v4 as uuidv4 } from 'uuid';
import { validateRoute, saveLine, createStop } from '../services/api';
import { useAuth } from '../context/authContext'
import StopMarker from '../components/map/StopMarker'
import useMapData from '../hooks/useMapData'
import NavigationBar from '../components/ui/NavigationBar'
import Footer from '../components/ui/Footer'


export default function MapPage() {
  const { stops } = useMapData()
  const { isAuthenticated } = useAuth();
  // --- Stop creation state ---
  const [creatingStop, setCreatingStop] = useState(false);

  // --- Route creation/validation state ---
  const [addingRoute, setAddingRoute] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [points, setPoints] = useState<{ id: string, lat: number, lng: number }[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null)

  // --- Stop creation logic (keep as is) ---
  const handleCreateStop = async (stopData) => {
    await createStop(stopData);
    setCreatingStop(false);
    // ...any other logic...
  };

  // --- Route creation/validation logic ---
  const handleAddPoint = (latlng: [number, number]) => {
    setPoints(prev => [...prev, { id: uuidv4(), lat: latlng[0], lng: latlng[1] }]);
  };

  const handleDeleteSelected = () => {
    if (selectedIdx !== null) {
      setPoints(prev => prev.filter((_, idx) => idx !== selectedIdx));
      setSelectedIdx(null);
    }
  }

  const handleVerifyRoute = async () => {
    setRouteGeoJSON(null);
    const payload = {
      points: points.map(pt => ({ lat: pt.lat, lon: pt.lng }))
    };
    try {
      const geojson = await validateRoute(payload);
      setRouteGeoJSON(typeof geojson === 'string' ? JSON.parse(geojson) : geojson);
      setIsValidated(true);
    } catch (err: any) {
      alert('Error: ' + (err?.response?.data || err.message));
    }
  };

  const handleSaveRoute = async () => {
    const lineData = {
      nombre: 'Nombre de la ruta', // Replace with form value
      descripcion: 'Descripción',  // Replace with form value
      empresa: 'Empresa',          // Replace with form value
      puntos: points.map(pt => ({ latitud: pt.lat, longitud: pt.lng })),
      rutaGeoJSON: routeGeoJSON
    };
    try {
      await saveLine(lineData);
      alert('Ruta guardada correctamente');
      setAddingRoute(false);
      setPoints([]);
      setSelectedIdx(null);
      setRouteGeoJSON(null);
      setIsValidated(false);
    } catch (err: any) {
      alert('Error al guardar la ruta: ' + (err?.response?.data || err.message));
    }
  };

  const handleCancelValidation = () => {
    setIsValidated(false);
    setRouteGeoJSON(null);
  };

  const handleCancelAddRoute = () => {
    setAddingRoute(false);
    setPoints([]);
    setSelectedIdx(null);
    setRouteGeoJSON(null);
    setIsValidated(false);
  };

  // --- Map marker logic ---
  function AddPointControl({ onAddPoint }: { onAddPoint: (latlng: [number, number]) => void }) {
    useMapEvents({
      click(e) {
        onAddPoint([e.latlng.lat, e.latlng.lng]);
      }
    });
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavigationBar />
      <main className="flex-1">
        {/* Main menu: show only if not creating stop or route */}
        {!creatingStop && !addingRoute && (
          <div className="flex gap-2">
            <button onClick={() => setCreatingStop(true)}>Crear Parada</button>
            <button onClick={() => setAddingRoute(true)}>Crear Ruta</button>
          </div>
        )}

        {/* Stop creation menu (keep your existing logic here) */}
        {creatingStop && (
          <ParadaForm
            onCancel={() => setCreatingStop(false)}
            onSubmit={handleCreateStop}
            // ...other props...
          />
        )}

        {/* Route creation/validation menu */}
        {addingRoute && (
          <PointControls
            adding={addingRoute}
            setAdding={setAddingRoute}
            selectedIdx={selectedIdx}
            handleDeleteSelected={handleDeleteSelected}
            handleVerifyRoute={handleVerifyRoute}
            handleSaveRoute={handleSaveRoute}
            pointsLength={points.length}
            handleCancelAdd={handleCancelAddRoute}
            isValidated={isValidated}
            handleCancelValidation={handleCancelValidation}
          />
        )}

        {/* Map and other components */}
        <MapContainer
          center={[-34.9, -56.2]}
          zoom={13}
          style={{ height: '80vh', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {addingRoute && !isValidated && <AddPointControl onAddPoint={handleAddPoint} />}
          {points.map((pt, idx) => (
            <Marker
              key={pt.id}
              position={[pt.lat, pt.lng]}
              draggable={!isValidated}
              eventHandlers={{
                dragend: (e) => !isValidated && handleAddPoint([e.target.getLatLng().lat, e.target.getLatLng().lng]),
                click: () => !isValidated && setSelectedIdx(idx)
              }}
              icon={L.icon({
                iconUrl: selectedIdx === idx ? 'marker-icon-red.png' : 'marker-icon.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'marker-shadow.png',
                shadowSize: [41, 41]
              })}
            />
          ))}
          {addingRoute && points.length >= 2 && (
            <RoutingControl waypoints={points.map(pt => [pt.lat, pt.lng])} serviceUrl="https://router.project-osrm.org/route/v1" />
          )}
          {stops && stops.map(stop => (
            <StopMarker key={stop.id} stop={stop} />
          ))}
          {routeGeoJSON && (
            <GeoJSON data={routeGeoJSON} style={{ color: 'red', weight: 5, opacity: 0.9 }} />
          )}
        </MapContainer>
      </main>
      <Footer />
    </div>
  );
}
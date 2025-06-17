import { MapContainer, Marker, useMapEvents, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useState, useRef } from 'react'
import L from 'leaflet'
import RoutingControl from '../components/map/RoutingControl'
import PointControls from '../components/map/PointsControls'
import { v4 as uuidv4 } from 'uuid'
import { validateRoute, saveLine, createStop } from '../services/api'
import StopMarker from '../components/map/StopMarker'
import useMapData from '../hooks/useMapData'
import NavigationBar from '../components/ui/NavigationBar'
import Footer from '../components/ui/Footer'
import markerIcon from '../assets/marker-icon.png'
import markerIconRed from '../assets/marker-icon-red.png'
import markerShadow from '../assets/marker-shadow.png'
import LayerController from '../components/map/LayerController'
import RouteForm from '../components/ui/RouteForm'
import StopForm from '../components/map/StopForm'

export default function MapPage() {
  const { stops } = useMapData()


  const [creatingStop, setCreatingStop] = useState(false)
  const [addingRoute, setAddingRoute] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const [showRouteForm, setShowRouteForm] = useState(false)
  const [points, setPoints] = useState<{ id: string, lat: number, lng: number }[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null)
  const latestRouteGeoJSON = useRef<any>(null);

  const handleCreateStop = async (stopData: any) => {
    await createStop(stopData)
    setCreatingStop(false)
  }

  const handleAddPoint = (latlng: [number, number]) => {
    setPoints(prev => [...prev, { id: uuidv4(), lat: latlng[0], lng: latlng[1] }])
  }

  const handleMarkerDrag = (idx: number, e: any) => {
    const { lat, lng } = e.target.getLatLng()
    setPoints(prev =>
      prev.map((p, i) => i === idx ? { ...p, lat, lng } : p)
    )
  }

  const handleDeleteSelected = () => {
    if (selectedIdx !== null) {
      setPoints(prev => prev.filter((_, idx) => idx !== selectedIdx))
      setSelectedIdx(null)
    }
  }

  const handleVerifyRoute = async () => {
    setRouteGeoJSON(null);
    const payload = {
      points: points.map(pt => ({ latitud: pt.lat, longitud: pt.lng }))
    };
    try {
      const response = await validateRoute(payload);
      if (typeof response === 'string' && response.includes('OK')) {
        if (!latestRouteGeoJSON.current) {
          alert("No se pudo obtener la ruta calculada (GeoJSON no disponible).");
          return;
        }
        setRouteGeoJSON(latestRouteGeoJSON.current);
        setIsValidated(true);
        setShowRouteForm(true);
      } else if (response && response.ok) {
        setIsValidated(true);
        setShowRouteForm(true);
      } else {
        setIsValidated(true);
        setShowRouteForm(true);
      }
    } catch (err: any) {
      alert('Error: ' + (err?.response?.data || err.message));
      setIsValidated(false);
      setShowRouteForm(false);
    }
  }

  const handleSaveRoute = async (formData: any) => {
    if (!routeGeoJSON) {
      alert("No se pudo obtener la ruta calculada. Intente verificar la ruta nuevamente.");
      return;
    }
    const lineData = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      empresa: formData.empresa,
      observacion: formData.observacion,
      puntos: points.map(pt => ({ latitud: pt.lat, longitud: pt.lng })),
      rutaGeoJSON: JSON.stringify(routeGeoJSON)
    };

    try {
      await saveLine(lineData)
      alert('Ruta guardada correctamente')
      setAddingRoute(false)
      setPoints([])
      setSelectedIdx(null)
      setRouteGeoJSON(null)
      setIsValidated(false)
      setShowRouteForm(false)
    } catch (err: any) {
      alert('Error al guardar la ruta: ' + (err?.response?.data || err.message))
    }
  }

  const handleCancelValidation = () => {
    setIsValidated(false)
    setRouteGeoJSON(null)
    setShowRouteForm(false)
  }

  const handleCancelAddRoute = () => {
    setAddingRoute(false)
    setPoints([])
    setSelectedIdx(null)
    setRouteGeoJSON(null)
    setIsValidated(false)
    setShowRouteForm(false)
  }

  function AddPointControl({ onAddPoint }: { onAddPoint: (latlng: [number, number]) => void }) {
    useMapEvents({
      click(e) {
        onAddPoint([e.latlng.lat, e.latlng.lng])
      }
    })
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavigationBar />
      <main className="flex-1">
        {/* Main menu: show only if not creating stop or route */}
        {!creatingStop && !addingRoute && (
          <div className="flex gap-2 justify-center my-4">
            <button className="bg-yellow-600 text-white px-4 py-2 rounded" onClick={() => setCreatingStop(true)}>Crear Parada</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setAddingRoute(true)}>Crear Ruta</button>
          </div>
        )}

        {/* Route creation/validation menu */}
        {addingRoute && !showRouteForm && (
          <PointControls
            adding={addingRoute}
            setAdding={setAddingRoute}
            selectedIdx={selectedIdx}
            handleDeleteSelected={handleDeleteSelected}
            handleVerifyRoute={handleVerifyRoute}
            handleSaveRoute={() => setShowRouteForm(true)} // <-- Mostrar RouteForm al guardar
            pointsLength={points.length}
            handleCancelAdd={handleCancelAddRoute}
            isValidated={isValidated}
            handleCancelValidation={handleCancelValidation}
          />
        )}

        {/* Route save form */}
        {addingRoute && isValidated && showRouteForm && (
          <RouteForm
            points={points.map(pt => [pt.lat, pt.lng])}
            onCancel={handleCancelValidation}
            onSave={handleSaveRoute}
          />
        )}

        {/* Map and other components */}
        <MapContainer
          center={[-34.9, -56.2]}
          zoom={13}
          style={{ height: '80vh', width: '100%' }}
        >
          <LayerController />
          {creatingStop && (
            <StopForm
              onCancel={() => setCreatingStop(false)}
              onSubmit={handleCreateStop}
            />
          )}
          {addingRoute && !isValidated && <AddPointControl onAddPoint={handleAddPoint} />}
          {points.map((pt, idx) => (
            <Marker
              key={pt.id}
              position={[pt.lat, pt.lng]}
              draggable={addingRoute && !isValidated}
              eventHandlers={{
                dragend: (e) => addingRoute && !isValidated && handleMarkerDrag(idx, e),
                click: () => addingRoute && !isValidated && setSelectedIdx(idx)
              }}
              icon={L.icon({
                iconUrl: selectedIdx === idx ? markerIconRed : markerIcon,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: markerShadow,
                shadowSize: [41, 41]
              })}
            />
          ))}
          {addingRoute && points.length >= 2 && (
            <RoutingControl
              waypoints={points.map(pt => [pt.lat, pt.lng])}
              serviceUrl="https://router.project-osrm.org/route/v1"
              onRouteGeoJSON={geojson => {
                latestRouteGeoJSON.current = geojson;
                console.log("OSRM route GeoJSON:", geojson);
              }}
            />
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
  )
}
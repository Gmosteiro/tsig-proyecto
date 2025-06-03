import { MapContainer, Marker, useMapEvents, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import StopMarker from '../components/map/StopMarker'
import useMapData from '../hooks/useMapData'
import NavigationBar from '../components/ui/NavigationBar'
import Footer from '../components/ui/Footer'
import { useState } from 'react'
import L from 'leaflet'
import { getRouteGeoJSON } from '../services/api'
import markerIcon from '../assets/marker-icon.png'
import markerIconRed from '../assets/marker-icon-red.png'
import markerShadow from '../assets/marker-shadow.png'
import PointControls from '../components/map/PointsControls'
import LayerController from '../components/map/LayerController'
import { useAuth } from '../context/authContext'


function AddPointControl({ onAddPoint }: { onAddPoint: (latlng: [number, number]) => void }) {
    useMapEvents({
        click(e) {
            onAddPoint([e.latlng.lat, e.latlng.lng])
        }
    })
    return null
}

export default function MapPage() {
    const { stops } = useMapData()
    const { isAuthenticated } = useAuth()
    const [adding, setAdding] = useState(false)
    const [points, setPoints] = useState<[number, number][]>([])
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
    const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null)

    const handleAddPoint = (latlng: [number, number]) => {
        setPoints((prev) => [...prev, latlng])
    }

    const handleDeleteSelected = () => {
        if (selectedIdx !== null) {
            setPoints(prev => prev.filter((_, idx) => idx !== selectedIdx))
            setSelectedIdx(null)
        }
    }

    const handleMarkerDrag = (idx: number, e: any) => {
        const { lat, lng } = e.target.getLatLng()
        setPoints(prev => prev.map((p, i) => i === idx ? [lat, lng] : p))
    }

    const handleSubmit = async () => {
        setRouteGeoJSON(null)
        const payload = {
            points: points.map(([lat, lon]) => ({ lat, lon }))
        }
        try {
            const geojson = await getRouteGeoJSON(payload)
            setRouteGeoJSON(typeof geojson === 'string' ? JSON.parse(geojson) : geojson)
        } catch (err: any) {
            alert('Error: ' + (err?.response?.data || err.message))
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            <NavigationBar />
            <main className="flex-1">
                {isAuthenticated && (
                    <PointControls
                        adding={adding}
                        setAdding={setAdding}
                        selectedIdx={selectedIdx}
                        handleDeleteSelected={handleDeleteSelected}
                        handleSubmit={handleSubmit}
                        pointsLength={points.length}
                    />
                )}
                <MapContainer
                    center={[-34.9011, -56.1645]}
                    zoom={13}
                    style={{ height: '80vh', width: '100%' }}
                >
                    <LayerController />
                    {isAuthenticated && adding && <AddPointControl onAddPoint={handleAddPoint} />}
                    {points.map((latlng, idx) => (
                        <Marker
                            key={idx}
                            position={latlng}
                            draggable={isAuthenticated}
                            eventHandlers={isAuthenticated ? {
                                dragend: (e) => handleMarkerDrag(idx, e),
                                click: () => setSelectedIdx(idx)
                            } : undefined}
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
import { MapContainer, TileLayer, WMSTileLayer, LayersControl, Marker, useMapEvents, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import StopMarker from '../components/map/StopMarker'
import useMapData from '../hooks/useMapData'
import NavigationBar from '../components/ui/NavigationBar'
import Footer from '../components/ui/Footer'
import StopForm from '../components/map/StopForm'
import { useState } from 'react'
import L from 'leaflet'
import { getRouteGeoJSON } from '../services/api'

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
        setRouteGeoJSON(null) // Remove previous route
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

    // Custom style for the route GeoJSON (red line)
    const routeStyle = {
        color: 'red',
        weight: 5,
        opacity: 0.9
    }

    return (
        <div className="flex flex-col min-h-screen">
            <NavigationBar />
            <main className="flex-1">
                <div className="flex gap-2 p-2">
                    <button
                        className={`px-3 py-1 rounded ${adding ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        onClick={() => setAdding(a => !a)}
                    >
                        {adding ? 'Adding: Click map' : 'Add Point'}
                    </button>
                    <button
                        className="px-3 py-1 rounded bg-red-400 text-white"
                        onClick={handleDeleteSelected}
                        disabled={selectedIdx === null}
                    >
                        Delete Selected Point
                    </button>
                    <button
                        className="px-3 py-1 rounded bg-green-500 text-white"
                        onClick={handleSubmit}
                        disabled={points.length === 0}
                    >
                        Submit
                    </button>
                </div>
                <MapContainer
                    center={[-34.9011, -56.1645]}
                    zoom={13}
                    style={{ height: '80vh', width: '100%' }}
                >
                    <StopForm />
                    <LayersControl position="bottomright">
                        <LayersControl.BaseLayer checked name="Mapa Base">
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; OpenStreetMap contributors"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.Overlay name="Caminera Nacional">
                            <WMSTileLayer
                                url='http://localhost:8080/geoserver/wms'
                                layers="tsig:ft_caminera_nacional"
                                format="image/png"
                                transparent={true}
                                tileSize={256}
                            />
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="Paradas">
                            <WMSTileLayer
                                url='http://localhost:8080/geoserver/wms'
                                layers="tsig:parada"
                                styles="Parada"
                                format="image/png"
                                transparent={true}
                                tileSize={256}
                            />
                        </LayersControl.Overlay>
                    </LayersControl>
                    {adding && <AddPointControl onAddPoint={handleAddPoint} />}
                    {points.map((latlng, idx) => (
                        <Marker
                            key={idx}
                            position={latlng}
                            draggable
                            eventHandlers={{
                                dragend: (e) => handleMarkerDrag(idx, e),
                                click: () => setSelectedIdx(idx)
                            }}
                            icon={L.icon({
                                iconUrl: selectedIdx === idx
                                    ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
                                    : "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                                shadowSize: [41, 41]
                            })}
                        />
                    ))}
                    {stops && stops.map(stop => (
                        <StopMarker key={stop.id} stop={stop} />
                    ))}
                    {routeGeoJSON && (
                        <GeoJSON data={routeGeoJSON} style={routeStyle} />
                    )}
                </MapContainer>
            </main>
            <Footer />
        </div>
    )
}
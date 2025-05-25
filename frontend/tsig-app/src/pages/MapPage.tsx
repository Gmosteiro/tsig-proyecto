import { MapContainer, TileLayer, WMSTileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import StopMarker from '../components/map/StopMarker'
import useMapData from '../hooks/useMapData'
import NavigationBar from '../components/ui/NavigationBar'
import Footer from '../components/ui/Footer'
import StopForm from '../components/map/StopForm'


export default function MapPage() {
    const { stops } = useMapData()

    return (
        <div className="flex flex-col min-h-screen">
            <NavigationBar />
            <main className="flex-1">
                <MapContainer
                    center={[-34.9011, -56.1645]}
                    zoom={13}
                    style={{ height: '80vh', width: '100%' }}
                >
                    <StopForm />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                    <WMSTileLayer
                        key="ft-caminera"
                        url="http://localhost:8080/geoserver/wms"
                        layers="tsig:ft_caminera_nacional"
                        format="image/png"
                        transparent={true}
                        tileSize={256}
                        errorTileUrl="https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg" // optional, for debugging
                        updateWhenZooming={false}
                        updateWhenIdle={true}
                    />
                    {stops && stops.map(stop => (
                        <StopMarker key={stop.id} stop={stop} />
                    ))}
                </MapContainer>
            </main>
            <Footer />
        </div>
    )
}
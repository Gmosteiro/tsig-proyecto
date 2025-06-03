import { MapContainer, TileLayer } from 'react-leaflet'
import NavigationBar from '../components/ui/NavigationBar'
import Footer from '../components/ui/Footer'
import 'leaflet/dist/leaflet.css'

export default function SimpleMapPage() {
    return (
        <div className="min-h-screen">
            <NavigationBar />
            <MapContainer
                center={[-34.9011, -56.1645]}
                zoom={13}
                style={{ height: '100vh', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />
            </MapContainer>
            <Footer />
        </div>
    )
}

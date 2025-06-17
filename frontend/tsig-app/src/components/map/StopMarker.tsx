import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'images/marker-icon-2x.png',
    iconUrl: 'images/marker-icon.png',
    shadowUrl: 'images/marker-shadow.png',
})

export default function StopMarker({ stop, onClick }: { stop: any, onClick?: (stop: any) => void }) {
    return (
        <Marker
            position={[stop.latitud, stop.longitud]}
            eventHandlers={{
                click: () => onClick && onClick(stop)
            }}
        >
            <Popup>
                <strong>{stop.name}</strong><br />
                {stop.route} - {stop.direction}
            </Popup>
        </Marker>
    )
}
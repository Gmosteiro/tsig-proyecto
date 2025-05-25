import { Marker, Popup } from 'react-leaflet'
import { Stop } from '../../lib/types/types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'images/marker-icon-2x.png',
    iconUrl: 'images/marker-icon.png',
    shadowUrl: 'images/marker-shadow.png',
})

export default function StopMarker({ stop }: { stop: Stop }) {
    return (

        <Marker position={[stop.location.coordinates[1], stop.location.coordinates[0]]}>
            <Popup>
                <strong>{stop.name}</strong><br />
                {stop.route} - {stop.direction}
            </Popup>
        </Marker>
    )
}
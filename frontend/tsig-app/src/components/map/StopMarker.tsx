import { Marker, Popup } from 'react-leaflet'
import { Stop } from '../../lib/types/types'

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
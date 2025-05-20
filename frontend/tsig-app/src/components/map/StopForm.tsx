import { useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'

export default function StopForm() {
    const [position, setPosition] = useState<LatLngExpression>([-34.9011, -56.1645])
    const [name, setName] = useState('Nueva Parada')

    return (
        <Marker
            draggable={true}
            position={position}
            eventHandlers={{
                dragend(e) {
                    const marker = e.target
                    const newPos = marker.getLatLng()
                    setPosition([newPos.lat, newPos.lng])
                }
            }}
        >
            <Popup>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        console.log('Guardando parada con:', { name, position })
                        alert('Parada creada (mock)')
                    }}
                >
                    <div>
                        <label htmlFor="stopName">Nombre:</label><br />
                        <input
                            id="stopName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <br />
                    <button type="submit">Crear parada</button>
                </form>
            </Popup>
        </Marker>
    )
}
import { useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import { LatLngTuple } from 'leaflet'
import { createStop } from '../../services/api'

export default function StopForm() {
    const [position, setPosition] = useState<LatLngTuple>([-34.9011, -56.1645])
    const [name, setName] = useState('Nueva Parada')

    return (
        <Marker
            draggable={true}
            position={position}
            eventHandlers={{
                dragend(e) {
                    const marker = e.target
                    const newPos = marker.getLatLng()
                    setPosition([newPos.lat, newPos.lng] as LatLngTuple)
                }
            }}
        >
            <Popup>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault()
                        console.log('Guardando parada con:', { name, position })
                        debugger
                        await createStop({
                            nombre: name,
                            estado: 'HABILITADA',
                            refugio: false,
                            observacion: '',
                            latitud: position[0],
                            longitud: position[1]
                        })

                        debugger

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
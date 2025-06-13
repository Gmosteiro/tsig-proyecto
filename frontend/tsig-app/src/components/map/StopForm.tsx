import { useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import { LatLngTuple } from 'leaflet'
import { createStop, EstadoParada } from '../../services/api'

export default function StopForm() {
    const [position, setPosition] = useState<LatLngTuple>([-34.9011, -56.1645])
    const [name, setName] = useState('Nueva Parada')
    const [estado, setEstado] = useState<EstadoParada>('HABILITADA')
    const [refugio, setRefugio] = useState(false)
    const [observacion, setObservacion] = useState('')

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
                    className="flex flex-col gap-3 p-2"
                    onSubmit={async (e) => {
                        e.preventDefault()
                        await createStop({
                            nombre: name,
                            estado,
                            refugio,
                            observacion,
                            lat: position[0],
                            lon: position[1]
                        })
                    }}
                >
                    <div>
                        <label htmlFor="stopName" className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre:
                        </label>
                        <input
                            id="stopName"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="stopEstado" className="block text-sm font-medium text-gray-700 mb-1">
                            Estado:
                        </label>
                        <select
                            id="stopEstado"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={estado}
                            onChange={e => setEstado(e.target.value as EstadoParada)}
                        >
                            <option value="HABILITADA">HABILITADA</option>
                            <option value="DESHABILITADA">DESHABILITADA</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="stopRefugio"
                            type="checkbox"
                            checked={refugio}
                            onChange={e => setRefugio(e.target.checked)}
                            className="rounded border-gray-300 focus:ring-blue-400"
                        />
                        <label htmlFor="stopRefugio" className="text-sm font-medium text-gray-700">
                            Refugio
                        </label>
                    </div>
                    <div>
                        <label htmlFor="stopObservacion" className="block text-sm font-medium text-gray-700 mb-1">
                            Observación:
                        </label>
                        <input
                            id="stopObservacion"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={observacion}
                            onChange={e => setObservacion(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded shadow transition-colors duration-150"
                    >
                        Crear parada
                    </button>
                </form>
            </Popup>
        </Marker>
    )
}
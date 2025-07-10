import { useState, useEffect } from 'react'
import { Marker, Popup } from 'react-leaflet'
import { LatLngTuple } from 'leaflet'

interface StopFormProps {
    onCancel: () => void
    onSubmit: (stopData: {
        nombre: string
        habilitada: boolean
        refugio: boolean
        observacion: string
        latitud: number
        longitud: number
        id?: number | string
    }) => void
    initialData?: {
        id?: number | string
        nombre: string
        habilitada: boolean
        refugio: boolean
        observacion: string
        latitud: number
        longitud: number
    }
}

export default function StopForm({ onCancel, onSubmit, initialData }: StopFormProps) {
    const [position, setPosition] = useState<LatLngTuple | null>(
        initialData ? [initialData.latitud, initialData.longitud] : null
    )
    const [name, setName] = useState(initialData?.nombre ?? '')
    const [habilitada, setHabilitada] = useState<boolean>(initialData?.habilitada ?? true)
    const [refugio, setRefugio] = useState(initialData?.refugio ?? false)
    const [observacion, setObservacion] = useState(initialData?.observacion ?? '')

    // Si initialData cambia (por ejemplo, al editar otra parada), actualiza el estado
    useEffect(() => {
        if (initialData) {
            setPosition([initialData.latitud, initialData.longitud])
            setName(initialData.nombre ?? '')
            setHabilitada(initialData.habilitada ?? true)
            setRefugio(initialData.refugio ?? false)
            setObservacion(initialData.observacion ?? '')
        }
    }, [initialData])

    // Si no hay posición, mostrar un mensaje y no renderizar el marcador
    if (!position) {
        return null
    }
    return (
        position && (
            <Marker
                draggable={true}
                position={position as [number, number]}
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
                            if (!position) return
                            await onSubmit({
                                nombre: name,
                                habilitada,
                                refugio,
                                observacion,
                                latitud: position[0],
                                longitud: position[1],
                                ...(initialData?.id ? { id: initialData.id } : {})
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
                                value={habilitada ? "true" : "false"}
                                onChange={e => setHabilitada(e.target.value === "true")}
                            >
                                <option value="true">Habilitada</option>
                                <option value="false">Deshabilitada</option>
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
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded shadow transition-colors duration-150 cursor-pointer"
                            >
                                {initialData ? 'Guardar cambios' : 'Crear parada'}
                            </button>
                            <button
                                type="button"
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded shadow transition-colors duration-150 cursor-pointer"
                                onClick={onCancel}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </Popup>
            </Marker>
        )
    )
}
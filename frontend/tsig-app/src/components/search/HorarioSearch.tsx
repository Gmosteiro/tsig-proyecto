import React, { useState } from 'react'
import { LineaDTO } from '../../services/linea'

interface HorarioSearchProps {
    onVerLinea?: (linea: LineaDTO) => void

}

const HorarioSearch: React.FC<HorarioSearchProps> = () => {
    const [hora, setHora] = useState('')
    const [resultados, setResultados] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setResultados([])

        try {
            // Aquí deberías llamar a tu API real
            // Simulación de resultados
            setTimeout(() => {
                setResultados([
                    { id: 1, nombre: 'Línea 101', horario: hora },
                    { id: 2, nombre: 'Línea 202', horario: hora }
                ])
                setLoading(false)
            }, 1000)
        } catch (err) {
            setError('Error al buscar líneas por horario')
            setLoading(false)
        }
    }

    return (
        <div>
            <form onSubmit={handleSearch} className="flex gap-2 items-center mb-4">
                <label htmlFor="hora" className="font-medium">Hora:</label>
                <input
                    id="hora"
                    type="time"
                    value={hora}
                    onChange={e => setHora(e.target.value)}
                    className="border rounded px-2 py-1"
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                    disabled={loading}
                >
                    Buscar
                </button>
            </form>
            {loading && <div>Buscando...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {resultados.length > 0 && (
                <ul className="mt-2">
                    {resultados.map(linea => (
                        <li key={linea.id} className="border-b py-1">
                            {linea.nombre} - Horario: {linea.horario}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default HorarioSearch;
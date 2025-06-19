import React, { useState } from 'react'
import { LineaDTO, getLineaByNombreEmpresa } from '../../services/linea'
import LinesList from './LinesList'

interface NombreSearchProps {
    onVerLinea?: (linea: LineaDTO) => void

}

const NombreSearch: React.FC<NombreSearchProps> = ({ onVerLinea }) => {
    const [nombre, setNombre] = useState('')
    const [resultados, setResultados] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setResultados([])

        try {

            const res = await getLineaByNombreEmpresa(nombre)

            if (res.length === 0) {
                setError('No se encontraron líneas con ese nombre')
            }

            setResultados(res)
            setLoading(false)
        } catch (err) {
            setError('Error al buscar líneas por nombre')
            setLoading(false)
        }
    }

    return (
        <div>
            <form onSubmit={handleSearch} className="flex gap-2 items-center mb-4">
                <label htmlFor="nombre" className="font-medium">Nombre o número de línea:</label>
                <input
                    id="nombre"
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
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
            <LinesList lineas={resultados} onVerLinea={onVerLinea} />
        </div>
    )
}

export default NombreSearch
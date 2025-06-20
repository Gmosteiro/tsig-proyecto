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
        <>
            <form
                onSubmit={handleSearch}
                className="flex flex-col md:flex-row gap-4 items-center mb-6"
            >
                <div className="flex flex-col w-full md:w-auto">
                    <label htmlFor="nombre" className="font-semibold mb-1 text-gray-700">Nombre de Empresa</label>
                    <input
                        id="nombre"
                        type="text"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold px-6 py-2 rounded shadow mt-2 md:mt-6"
                    disabled={loading}
                >
                    {loading ? "Buscando..." : "Buscar"}
                </button>
            </form>
            {error && <div className="text-red-600 mb-4">{error}</div>}
            <LinesList lineas={resultados} onVerLinea={onVerLinea} />
        </>
    )
}

export default NombreSearch
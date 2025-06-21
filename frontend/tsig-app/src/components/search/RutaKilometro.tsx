import React, { useState } from 'react'
import { LineaDTO, getLineasPorKilometro } from '../../services/linea'
import LinesList from './LinesList'

interface RutaKilometroProps {
    onVerLinea?: (linea: LineaDTO) => void
}

const RutaKilometro: React.FC<RutaKilometroProps> = ({ onVerLinea }) => {
    const [ruta, setRuta] = useState('')
    const [kilometro, setKilometro] = useState('')
    const [resultados, setResultados] = useState<LineaDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setResultados([])

        try {
            const res = await getLineasPorKilometro(Number(kilometro), Number(ruta))
            if (res.length === 0) {
                setError('No se encontraron líneas para esa ruta y kilómetro')
            }
            setResultados(res)
        } catch (err) {
            setError('Error al buscar líneas por ruta y kilómetro')
        }
        setLoading(false)
    }

    return (
        <>
            <form
                onSubmit={handleSearch}
                className="flex flex-col md:flex-row gap-4 items-center mb-6"
            >
                <div className="flex flex-col w-full md:w-auto">
                    <label htmlFor="ruta" className="font-semibold mb-1 text-gray-700">Ruta</label>
                    <input
                        id="ruta"
                        type="number"
                        value={ruta}
                        onChange={e => setRuta(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                        min={1}
                    />
                </div>
                <div className="flex flex-col w-full md:w-auto">
                    <label htmlFor="kilometro" className="font-semibold mb-1 text-gray-700">Kilómetro</label>
                    <input
                        id="kilometro"
                        type="number"
                        value={kilometro}
                        onChange={e => setKilometro(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                        min={0}
                        step={0.01}
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

export default RutaKilometro
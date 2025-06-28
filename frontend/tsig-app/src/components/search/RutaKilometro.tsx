import React, { useState, useEffect } from 'react'
import { LineaDTO, getLineasPorKilometro } from '../../services/linea'
import LinesList from './LinesList'

interface RutaKilometroProps {
    onVerLinea?: (linea: LineaDTO) => void
    onResultadosBusqueda?: (lineas: LineaDTO[]) => void
    // Props para mantener el estado
    initialRuta?: string
    initialKilometro?: string
    initialResultados?: LineaDTO[]
    onStateChange?: (state: { ruta: string; kilometro: string; resultados: LineaDTO[] }) => void
}

const RutaKilometro: React.FC<RutaKilometroProps> = ({ 
    onVerLinea, 
    onResultadosBusqueda,
    initialRuta = '',
    initialKilometro = '',
    initialResultados = [],
    onStateChange
}) => {
    const [ruta, setRuta] = useState(initialRuta)
    const [kilometro, setKilometro] = useState(initialKilometro)
    const [resultados, setResultados] = useState<LineaDTO[]>(initialResultados)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Actualizar estado interno cuando cambien las props iniciales
    useEffect(() => {
        setRuta(initialRuta)
        setKilometro(initialKilometro)
        setResultados(initialResultados)
    }, [initialRuta, initialKilometro, initialResultados])

    // Notificar cambios de estado al componente padre
    useEffect(() => {
        if (onStateChange) {
            onStateChange({ ruta, kilometro, resultados })
        }
    }, [ruta, kilometro, resultados, onStateChange])

    const handleRutaChange = (value: string) => {
        setRuta(value)
    }

    const handleKilometroChange = (value: string) => {
        setKilometro(value)
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        
        const newResultados: LineaDTO[] = []
        setResultados(newResultados)

        try {
            const res = await getLineasPorKilometro(Number(kilometro), Number(ruta))
            if (res.length === 0) {
                setError('No se encontraron líneas para esa ruta y kilómetro')
            } else {
                setError(null)
            }
            setResultados(res)
            // Notificar al componente padre sobre los resultados
            onResultadosBusqueda?.(res)
        } catch (err) {
            setError('Error al buscar líneas por ruta y kilómetro')
            setResultados([])
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
                        onChange={e => handleRutaChange(e.target.value)}
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
                        onChange={e => handleKilometroChange(e.target.value)}
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
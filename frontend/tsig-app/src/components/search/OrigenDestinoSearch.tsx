import React, { useState, useEffect } from 'react'
import { getDepartamentos, getLineaOrigenDestino, LineaDTO } from '../../services/linea'
import LinesList from './LinesList'

type OrigenDestinoSearchProps = {
    onVerLinea?: (linea: LineaDTO) => void
}

const OrigenDestinoSearch: React.FC<OrigenDestinoSearchProps> = ({ onVerLinea }) => {
    const [departamentos, setDepartamentos] = useState<{ id: number, nombre: string }[]>([])
    const [origen, setOrigen] = useState<number | ''>('')
    const [destino, setDestino] = useState<number | ''>('')
    const [resultados, setResultados] = useState<LineaDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        getDepartamentos().then(setDepartamentos)
    }, [])

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setResultados([])

        try {
            if (origen && destino) {
                const data = {
                    idDepartamentoOrigen: origen,
                    idDepartamentoDestino: destino
                }
                const res = await getLineaOrigenDestino(data)
                setResultados(res)
            }
        } catch (err) {
            setError('Error al buscar líneas por origen y destino')
        } finally {
            setLoading(false)
        }
    }

    return (
        // <div className="bg-white rounded-lg shadow p-6 max-w-xl">
        <>
            <form
                onSubmit={handleSearch}
                className="flex flex-col md:flex-row gap-4 items-center mb-6"
            >
                <div className="flex flex-col w-full md:w-auto">
                    <label htmlFor="origen" className="font-semibold mb-1 text-gray-700">Origen</label>
                    <select
                        id="origen"
                        value={origen}
                        onChange={e => setOrigen(Number(e.target.value))}
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    >
                        <option value="">Seleccione</option>
                        {departamentos.map(dep => (
                            <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col w-full md:w-auto">
                    <label htmlFor="destino" className="font-semibold mb-1 text-gray-700">Destino</label>
                    <select
                        id="destino"
                        value={destino}
                        onChange={e => setDestino(Number(e.target.value))}
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    >
                        <option value="">Seleccione</option>
                        {departamentos.map(dep => (
                            <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                        ))}
                    </select>
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
        // </div>

    )
}
export default OrigenDestinoSearch
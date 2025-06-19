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
        <div>
            <form onSubmit={handleSearch} className="flex gap-2 items-center mb-4 flex-wrap">
                <label htmlFor="origen" className="font-medium">Origen:</label>
                <select
                    id="origen"
                    value={origen}
                    onChange={e => setOrigen(Number(e.target.value))}
                    className="border rounded px-2 py-1"
                    required
                >
                    <option value="">Seleccione</option>
                    {departamentos.map(dep => (
                        <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                    ))}
                </select>
                <label htmlFor="destino" className="font-medium">Destino:</label>
                <select
                    id="destino"
                    value={destino}
                    onChange={e => setDestino(Number(e.target.value))}
                    className="border rounded px-2 py-1"
                    required
                >
                    <option value="">Seleccione</option>
                    {departamentos.map(dep => (
                        <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                    ))}
                </select>
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
export default OrigenDestinoSearch
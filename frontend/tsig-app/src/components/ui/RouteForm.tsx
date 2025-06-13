import { useState, useEffect } from 'react'
import { createLine } from '../../services/api'

interface RouteFormProps {
    points: [number, number][]
    onCancel: () => void
}

export default function RouteForm({ points, onCancel }: RouteFormProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [company, setCompany] = useState('')
    const [observations, setObservations] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (success) {
            const timeout = setTimeout(() => {
                onCancel()
            }, 2000) // Espera 1 segundo para mostrar el mensaje de éxito
            return () => clearTimeout(timeout)
        }
    }, [success, onCancel])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)
        try {
            const response = await createLine({
                nombre: name,
                descripcion: description,
                empresa: company,
                observacion: observations,
                puntos: points.map(point => ({
                    lat: point[0],
                    lon: point[1]
                }))
            });
            if (typeof response != 'string') throw new Error('Error guardando la línea')
            setSuccess(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form className="max-w-md mx-auto bg-white p-6 rounded shadow" onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold mb-4">Registrar Línea de Transporte</h2>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Nombre de línea</label>
                <input
                    type="text"
                    className="w-full border px-3 py-2 rounded"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Descripción</label>
                <input
                    type="text"
                    className="w-full border px-3 py-2 rounded"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Empresa</label>
                <input
                    type="text"
                    className="w-full border px-3 py-2 rounded"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Observaciones</label>
                <textarea
                    className="w-full border px-3 py-2 rounded"
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                />
            </div>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">Línea guardada correctamente.</div>}
            <div className="flex gap-2">
                <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded"
                    disabled={loading}
                >
                    {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                    type="button"
                    className="bg-gray-400 text-white px-4 py-2 rounded"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancelar
                </button>
            </div>
        </form>
    )
}
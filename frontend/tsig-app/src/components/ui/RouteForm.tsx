import { useState, useEffect } from 'react'

interface RouteFormProps {
    points: [number, number][]
    onCancel: () => void
    onSave: (formData: { nombre: string, descripcion: string, empresa: string, observacion?: string }) => void
    initialData?: {
        nombre?: string
        descripcion?: string
        empresa?: string
        observacion?: string
    }
}

export default function RouteForm({ onCancel, onSave, points, initialData }: RouteFormProps) {
    const [name, setName] = useState(initialData?.nombre || '')
    const [description, setDescription] = useState(initialData?.descripcion || '')
    const [company, setCompany] = useState(initialData?.empresa || '')
    const [observations, setObservations] = useState(initialData?.observacion || '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [routePoints, setRoutePoints] = useState<[number, number][]>(points || [])

    useEffect(() => {
        if (success) {
            const timeout = setTimeout(() => {
                onCancel()
            }, 2000)
            return () => clearTimeout(timeout)
        }
    }, [success, onCancel])

    // Ejemplo: agregar un punto manualmente (puedes reemplazar esto por integración con mapa)
    const handleAddPoint = () => {
        setRoutePoints([...routePoints, [0, 0]])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)
        try {
            await onSave({
                nombre: name,
                descripcion: description,
                empresa: company,
                observacion: observations,
                puntos: routePoints
            })
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
            <div className="mb-4">
                <label className="block mb-1 font-medium">Puntos de la ruta</label>
                <ul>
                    {routePoints.map((pt, idx) => (
                        <li key={idx}>[{pt[0]}, {pt[1]}]</li>
                    ))}
                </ul>
                <button type="button" className="bg-blue-500 text-white px-2 py-1 rounded mt-2" onClick={handleAddPoint}>
                    Agregar punto
                </button>
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
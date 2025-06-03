import { useState } from 'react'

interface RouteFormProps {
    geoJSON: any
    points: [number, number][]
    onCancel: () => void
}

export default function RouteForm({ geoJSON, points, onCancel }: RouteFormProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)
        try {
            // Replace with your actual API call
            const response = await fetch('/api/routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    geojson: geoJSON,
                    points
                })
            })
            if (!response.ok) throw new Error('Error saving route')
            setSuccess(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form className="max-w-md mx-auto bg-white p-6 rounded shadow" onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold mb-4">Guardar Ruta</h2>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Nombre</label>
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
                <textarea
                    className="w-full border px-3 py-2 rounded"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                />
            </div>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">Ruta guardada correctamente.</div>}
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
import { useState, useEffect } from 'react'
import { getEmpresas } from '../../services/api'

interface RouteFormProps {
    points: [number, number][]
    onCancel: () => void
    onSave: (formData: { descripcion: string, empresa: string, observacion?: string }) => void
    initialData?: {
        descripcion?: string
        empresa?: string
        observacion?: string
    }
}

export default function RouteForm({ onCancel, onSave, initialData }: RouteFormProps) {
    const [description, setDescription] = useState(initialData?.descripcion || '')
    const [company, setCompany] = useState(initialData?.empresa || '')
    const [empresas, setEmpresas] = useState<{ id: number, nombre: string }[]>([])
    const [observations, setObservations] = useState(initialData?.observacion || '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const empresasData = await getEmpresas()
                setEmpresas(empresasData)
            } catch (err) {
                console.error('Error al cargar empresas:', err)
            }
        }
        fetchEmpresas()
    }, [])

    useEffect(() => {
        if (initialData) {
            setDescription(initialData.descripcion || '')
            setCompany(initialData.empresa || '')
            setObservations(initialData.observacion || '')
        }
    }, [initialData])

    useEffect(() => {
        if (success) {
            const timeout = setTimeout(() => {
                onCancel()
            }, 2000)
            return () => clearTimeout(timeout)
        }
    }, [success, onCancel])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)
        try {
            await onSave({
                descripcion: description,
                empresa: company,
                observacion: observations
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
            <h2 className="text-xl font-bold mb-4">
                {initialData ? 'Modificar Línea de Transporte' : 'Registrar Línea de Transporte'}
            </h2>
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
                <select
                    className="w-full border px-3 py-2 rounded"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                >
                    <option value="">Seleccionar empresa...</option>
                    {empresas.map(empresa => (
                        <option key={empresa.id} value={empresa.nombre}>
                            {empresa.nombre}
                        </option>
                    ))}
                </select>
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
                    {loading ? 
                        (initialData ? 'Modificando...' : 'Guardando...') : 
                        (initialData ? 'Modificar' : 'Guardar')
                    }
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
import React, { useState } from 'react'

interface NombreSearchProps {
    // Puedes agregar props si necesitas pasar datos desde el padre
}

const NombreSearch: React.FC<NombreSearchProps> = () => {
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
            // Aquí deberías llamar a tu API real
            // Simulación de resultados
            setTimeout(() => {
                setResultados([
                    { id: 1, nombre: 'Línea 101', descripcion: 'Recorrido Centro - Barrio Sur' },
                    { id: 2, nombre: 'Línea 202', descripcion: 'Recorrido Centro - Prado' }
                ])
                setLoading(false)
            }, 1000)
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
            {resultados.length > 0 && (
                <ul className="mt-2">
                    {resultados.map(linea => (
                        <li key={linea.id} className="border-b py-1">
                            <span className="font-semibold">{linea.nombre}</span> - {linea.descripcion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default NombreSearch
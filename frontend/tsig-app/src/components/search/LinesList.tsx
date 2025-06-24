import React from 'react'
import { LineaDTO } from '../../services/linea'


type LinesListProps = {
    lineas: LineaDTO[]
    onVerLinea?: (linea: LineaDTO) => void
    onEditLinea?: (linea: LineaDTO) => void // Nuevo prop
}

const LinesList: React.FC<LinesListProps> = ({ lineas, onVerLinea, onEditLinea }) => {
    if (!lineas.length) return null

    return (
        <ul className="mt-4 bg-white rounded-lg shadow divide-y divide-gray-200 border">
            {lineas.map(linea => (
                <li
                    key={linea.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 px-4 py-3 hover:bg-blue-50 transition-colors"
                >
                    <span className="font-semibold text-blue-700 text-lg">{linea.nombre}</span>
                    {linea.descripcion && (
                        <span className="text-gray-600 text-base">{linea.descripcion}</span>
                    )}
                    <button
                        className="ml-auto bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        onClick={() => onVerLinea?.(linea)}
                    >
                        Ver
                    </button>
                    {onEditLinea && (
                        <button
                            className="bg-blue-600 text-white px-2 py-1 rounded ml-2"
                            onClick={() => onEditLinea(linea)}
                        >
                            Editar
                        </button>
                    )}
                </li>
            ))}
        </ul>
    )
}

export default LinesList
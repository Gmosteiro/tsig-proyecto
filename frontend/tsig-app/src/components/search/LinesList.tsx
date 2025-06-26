import React from 'react'
import { LineaDTO } from '../../services/linea'


type LinesListProps = {
    lineas: LineaDTO[]
    onVerLinea?: (linea: LineaDTO) => void // Nuevo prop
}

const LinesList: React.FC<LinesListProps> = ({ lineas, onVerLinea }) => {
    if (!lineas.length) {
        return (
            <div className="text-gray-400 text-center py-8">
                No se encontraron líneas.
            </div>
        )
    }

    return (
        <ul className="mt-4 bg-white rounded-lg shadow divide-y divide-gray-200 border">
            {lineas.map(linea => (
                <li
                    key={linea.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 px-4 py-3 hover:bg-blue-50 transition-colors"
                >
                    <span className="font-semibold text-blue-700 text-lg">{linea.descripcion}</span>
                    {linea.observacion && (
                        <span className="text-gray-600 text-base">{linea.observacion}</span>
                    )}
                    <button
                        className="ml-auto bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        onClick={() => onVerLinea?.(linea)}
                    >
                        Ver
                    </button>
                </li>
            ))}
        </ul>
    )
}

export default LinesList
import React, { useState } from 'react'
import OrigenDestinoSearch from './OrigenDestinoSearch'
import NombreSearch from './NombreSearch'
import HorarioSearch from './HorarioSearch'
import LinesList from './LinesList' // <-- Importa LinesList

type SearchType = 'origenDestino' | 'nombre' | 'horario' | 'poligono' | null

type SearcherProps = {
    onVerLinea?: (linea: any) => void,
    initialLines?: any[] | null
}

const searchOptions = [
    { value: 'origenDestino', label: 'Por Origen y Destino' },
    { value: 'nombre', label: 'Por Nombre de Empresa' },
    { value: 'horario', label: 'Por Horario' }
]

const Searcher: React.FC<SearcherProps> = ({ onVerLinea, initialLines }) => {
    const [searchType, setSearchType] = useState<SearchType>(initialLines ? 'poligono' : null)

    if (initialLines && searchType === 'poligono') {
        return (
            <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-auto p-6 border border-gray-100">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Líneas encontradas en el polígono</h2>
                {initialLines.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">No se encontraron líneas.</div>
                ) : (
                    <LinesList lineas={initialLines} onVerLinea={onVerLinea} />
                )}
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-auto p-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Buscar líneas de transporte</h2>
            <div className="mb-6 flex flex-wrap gap-2">
                {searchOptions.map(opt => (
                    <button
                        key={opt.value}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors border
                            ${searchType === opt.value
                                ? 'bg-blue-600 text-white border-blue-600 shadow'
                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400'}
                        `}
                        onClick={() => setSearchType(opt.value as SearchType)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            <div>
                {searchType === 'origenDestino' && <OrigenDestinoSearch onVerLinea={onVerLinea} />}
                {searchType === 'nombre' && <NombreSearch onVerLinea={onVerLinea} />}
                {searchType === 'horario' && <HorarioSearch onVerLinea={onVerLinea} />}
                {!searchType && (
                    <div className="text-gray-400 text-center py-8">
                        Selecciona un tipo de búsqueda para comenzar.
                    </div>
                )}
            </div>
        </div>
    )
}

export default Searcher
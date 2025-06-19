import React, { useState } from 'react'
import OrigenDestinoSearch from './OrigenDestinoSearch'
import NombreSearch from './NombreSearch'
import HorarioSearch from './HorarioSearch'

type SearchType = 'origenDestino' | 'nombre' | 'horario' | 'poligono' | null

type SearcherProps = {
    onVerLinea?: (linea: any) => void
}

const searchOptions = [
    { value: 'origenDestino', label: 'Por Origen y Destino' },
    { value: 'nombre', label: 'Por Nombre de Línea' },
    { value: 'horario', label: 'Por Horario' }
]

const Searcher: React.FC<SearcherProps> = ({ onVerLinea }) => {
    const [searchType, setSearchType] = useState<SearchType>(null)

    return (
        <div className="p-4 bg-white rounded shadow-md w-full max-w-lg mx-auto">
            <h2 className="text-lg font-semibold mb-2">Buscar líneas de transporte</h2>
            <div className="mb-4 flex gap-2">
                {searchOptions.map(opt => (
                    <button
                        key={opt.value}
                        className={`px-3 py-1 rounded ${searchType === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
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
                {!searchType && <div className="text-gray-500">Selecciona un tipo de búsqueda</div>}
            </div>
        </div>
    )
}

export default Searcher
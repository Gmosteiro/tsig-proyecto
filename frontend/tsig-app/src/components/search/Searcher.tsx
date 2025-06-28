import React, { useState, useEffect } from 'react'
import OrigenDestinoSearch from './OrigenDestinoSearch'
import NombreSearch from './NombreSearch'
import HorarioSearch from './HorarioSearch'
import LinesList from './LinesList' // <-- Importa LinesList
import RutaKilometro from './RutaKilometro'

type SearchType = 'origenDestino' | 'nombre' | 'horario' | 'kilometro' | 'poligono' | null

type SearcherProps = {
    onVerLinea?: (linea: any) => void,
    onResultadosBusqueda?: (lineas: any[]) => void,
    initialLines?: any[] | null,
    // Nuevas props para mantener el estado
    searchType?: SearchType,
    onSearchTypeChange?: (type: SearchType) => void,
    // Props para el estado de RutaKilometro
    rutaKilometroState?: {
        ruta: string;
        kilometro: string;
        resultados: any[];
    },
    onRutaKilometroStateChange?: (state: { ruta: string; kilometro: string; resultados: any[] }) => void,
    // Props para el estado del polígono
    onEnablePolygonDraw?: () => void,
    polygonLines?: any[] | null
}

const searchOptions = [
    { value: 'origenDestino', label: 'Por Origen y Destino' },
    { value: 'nombre', label: 'Por Nombre de Empresa' },
    { value: 'horario', label: 'Por Horario' },
    { value: 'kilometro', label: 'Por ruta y kilómetro' },
    { value: 'poligono', label: 'Filtrar por Área' },
]

const Searcher: React.FC<SearcherProps> = ({ 
    onVerLinea, 
    onResultadosBusqueda,
    initialLines, 
    searchType: externalSearchType,
    onSearchTypeChange,
    rutaKilometroState,
    onRutaKilometroStateChange,
    onEnablePolygonDraw,
    polygonLines
}) => {
    // Estado interno como fallback si no se pasan las props externas
    const [internalSearchType, setInternalSearchType] = useState<SearchType>(initialLines ? 'poligono' : null)
    
    // Usar el estado externo si está disponible, sino usar el interno
    const currentSearchType = externalSearchType !== undefined ? externalSearchType : internalSearchType
    
    // Función para cambiar el tipo de búsqueda
    const handleSearchTypeChange = (type: SearchType) => {
        if (onSearchTypeChange) {
            onSearchTypeChange(type)
        } else {
            setInternalSearchType(type)
        }
        
        // Si se selecciona polígono, habilitar el modo de dibujo
        if (type === 'poligono' && onEnablePolygonDraw) {
            onEnablePolygonDraw()
        }
    }

    // Actualizar el estado interno cuando cambie el externo
    useEffect(() => {
        if (externalSearchType !== undefined) {
            setInternalSearchType(externalSearchType)
        }
    }, [externalSearchType])

    // Determinar qué contenido mostrar
    const getSearchContent = () => {
        if (currentSearchType === 'poligono') {
            // Mostrar resultados del polígono si están disponibles
            const linesToShow = polygonLines || initialLines;
            if (linesToShow && linesToShow.length >= 0) {
                return (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Líneas encontradas en el polígono</h3>
                        {linesToShow.length === 0 ? (
                            <div className="text-gray-400 text-center py-8">No se encontraron líneas.</div>
                        ) : (
                            <LinesList lineas={linesToShow} onVerLinea={onVerLinea} />
                        )}
                    </div>
                );
            } else {
                // Modo de dibujo
                return (
                    <div className="text-blue-600 text-center py-8">
                        <div className="text-lg font-semibold mb-2">Modo de dibujo habilitado</div>
                        <div className="text-sm">Dibuja un polígono en el mapa para filtrar rutas por área</div>
                    </div>
                );
            }
        }
        
        if (currentSearchType === 'origenDestino') return <OrigenDestinoSearch onVerLinea={onVerLinea} onResultadosBusqueda={onResultadosBusqueda} />;
        if (currentSearchType === 'nombre') return <NombreSearch onVerLinea={onVerLinea} onResultadosBusqueda={onResultadosBusqueda} />;
        if (currentSearchType === 'horario') return <HorarioSearch onVerLinea={onVerLinea} onResultadosBusqueda={onResultadosBusqueda} />;
        if (currentSearchType === 'kilometro') {
            return (
                <RutaKilometro 
                    onVerLinea={onVerLinea}
                    onResultadosBusqueda={onResultadosBusqueda}
                    initialRuta={rutaKilometroState?.ruta || ''}
                    initialKilometro={rutaKilometroState?.kilometro || ''}
                    initialResultados={rutaKilometroState?.resultados || []}
                    onStateChange={onRutaKilometroStateChange}
                />
            );
        }
        
        return (
            <div className="text-gray-400 text-center py-8">
                Selecciona un tipo de búsqueda para comenzar.
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-auto p-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Buscar líneas de transporte</h2>
            <div className="mb-6 flex flex-nowrap gap-2">
                {searchOptions.map(opt => (
                    <button
                        key={opt.value}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 border cursor-pointer transform hover:scale-105
                            ${currentSearchType === opt.value
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                                : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 hover:shadow-md'}
                        `}
                        onClick={() => handleSearchTypeChange(opt.value as SearchType)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            <div>
                {getSearchContent()}
            </div>
        </div>
    )
}

export default Searcher
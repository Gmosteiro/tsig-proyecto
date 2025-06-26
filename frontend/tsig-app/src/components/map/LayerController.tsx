import { TileLayer, WMSTileLayer, LayersControl } from 'react-leaflet'
import { useState, useEffect, useRef } from 'react'
import { ParadaDTO, ParadaLineaDTO } from '../../services/api'
import { LineaDTO, getLineById } from '../../services/linea'
import WMSFeatureInfoHandler from './WMSFeatureInfoHandler'
import StopInfoPopupContainer from './StopInfoPopupContainer'
import LineInfoPopupContainer from './LineInfoPopupContainer'
import StopInfoReadOnlyPopup from './StopInfoReadOnlyPopup'
import LineInfoReadOnlyPopup from './LineInfoReadOnlyPopup'
import LineStopsPopup from './LineStopsPopup'
import { WMS_URL, DEFAULT_TILE_SIZE } from '../../lib/constants'
import { useAuth } from '../../context/authContext'
import L from 'leaflet'

export default function LayerController({ onMoveStop, onModifyLineRoute, onViewLine, onCenterMap, selectedLineaFromParent, onClearSelectedLine }: { 
    onMoveStop?: (parada: ParadaDTO) => void
    onModifyLineRoute?: (linea: LineaDTO) => void 
    onViewLine?: (linea: LineaDTO) => void
    onCenterMap?: (latitud: number, longitud: number, zoom?: number) => void
    selectedLineaFromParent?: LineaDTO | null
    onClearSelectedLine?: () => void
}) {
    const { isAuthenticated } = useAuth()
    const [camineraVisible, setCamineraVisible] = useState(false)
    const [paradaVisible, setParadaVisible] = useState(true)
    const [lineaVisible, setLineaVisible] = useState(true)
    const [selectedParada, setSelectedParada] = useState<ParadaDTO | null>(null)
    const [selectedLinea, setSelectedLinea] = useState<LineaDTO | null>(null)
    const [showLineStops, setShowLineStops] = useState<{ lineaId: number; lineaDescripcion: string } | null>(null)
    const [paradaFiltro, setParadaFiltro] = useState<'todos' | 'habilitadas' | 'deshabilitadas'>('todos')
    const [lineaFiltro, setLineaFiltro] = useState<'todos' | 'habilitadas' | 'deshabilitadas'>('todos')
    const [mapaBaseActivo, setMapaBaseActivo] = useState<'claro' | 'oscuro'>('claro')
    const hasInitializedMap = useRef(false) // Para evitar centrar el mapa múltiples veces

    // Obtener geolocalización para centrar el mapa (sin filtrar contenido) - SOLO EN LA CARGA INICIAL
    useEffect(() => {
        // Solo ejecutar si no se ha inicializado antes
        if (hasInitializedMap.current) return
        
        if (!isAuthenticated) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude
                    const lng = position.coords.longitude
                    // Centrar mapa en la ubicación del usuario con zoom para ver ~4km de radio
                    if (onCenterMap) {
                        onCenterMap(lat, lng, 13) // Zoom 13 aproximadamente muestra 4km de radio
                    }
                    hasInitializedMap.current = true
                },
                (error) => {
                    console.error("Error obteniendo geolocalización:", error)
                    // Si no se puede obtener geolocalización, centrar en Uruguay
                    if (onCenterMap) {
                        onCenterMap(-32.5, -56.0, 7) // Centro de Uruguay con zoom para ver todo el país
                    }
                    hasInitializedMap.current = true
                }
            )
        } else {
            // Para usuarios autenticados, siempre mostrar todo Uruguay
            if (onCenterMap) {
                onCenterMap(-32.5, -56.0, 7) // Centro de Uruguay con zoom para ver todo el país
            }
            hasInitializedMap.current = true
        }
    }, [isAuthenticated]) // Remover onCenterMap de las dependencias

    // Sincronizar línea seleccionada desde el componente padre
    useEffect(() => {
        setSelectedLinea(selectedLineaFromParent || null)
    }, [selectedLineaFromParent])

    /**
     * Construye el filtro CQL para paradas según el estado seleccionado
     */
    const buildCqlFilter = () => {
        if (paradaFiltro === 'habilitadas') {
            return 'estado=1'  // 1 = Habilitada
        } else if (paradaFiltro === 'deshabilitadas') {
            return 'estado=0'  // 0 = Deshabilitada
        }
        return undefined
    }

    const paradaCqlFilter = buildCqlFilter()

    /**
     * Construye el filtro CQL para lineas según el estado seleccionado
     */
    const buildLineaCqlFilter = () => {
        if (lineaFiltro === 'habilitadas') {
            return 'esta_habilitada=true'
        } else if (lineaFiltro === 'deshabilitadas') {
            return 'esta_habilitada=false'
        }
        return undefined
    }

    const lineaCqlFilter = buildLineaCqlFilter()

    return (
        <>
            <LayersControl position="bottomright">
                <LayersControl.BaseLayer checked name="Mapa Base Claro">
                    <TileLayer
                        eventHandlers={{ 
                            add: () => setMapaBaseActivo('claro'),
                        }}
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Mapa Base Oscuro">
                    <TileLayer
                        eventHandlers={{ 
                            add: () => setMapaBaseActivo('oscuro'),
                        }}
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                </LayersControl.BaseLayer>
                {/* Solo mostrar caminera nacional para usuarios autenticados */}
                {isAuthenticated && (
                    <LayersControl.Overlay name="Caminera Nacional" checked={camineraVisible}>
                        <WMSTileLayer
                            eventHandlers={{ add: () => setCamineraVisible(true), remove: () => setCamineraVisible(false) }}
                            url={WMS_URL}
                            layers="tsig:ft_caminera_nacional"
                            format="image/png"
                            transparent={true}
                            tileSize={DEFAULT_TILE_SIZE}
                        />
                    </LayersControl.Overlay>
                )}
                {/* IMPORTANTE: Las líneas van ANTES de las paradas para que las paradas se rendericen por encima */}
                <LayersControl.Overlay name="Líneas" checked={lineaVisible}>
                    <WMSTileLayer
                        key={`lineas-${lineaFiltro}-${mapaBaseActivo}-${isAuthenticated}`}
                        eventHandlers={{ add: () => setLineaVisible(true), remove: () => setLineaVisible(false) }}
                        url={WMS_URL}
                        layers="tsig:linea"
                        styles={mapaBaseActivo === 'claro' ? 'tsig:lineas_claro' : 'tsig:lineas_oscuro'}
                        format="image/png"
                        transparent={true}
                        tileSize={DEFAULT_TILE_SIZE}
                            params={lineaCqlFilter ? ({ CQL_FILTER: lineaCqlFilter } as any) : {}}
                        />
                </LayersControl.Overlay>
                <LayersControl.Overlay name="Paradas" checked={paradaVisible}>
                    <WMSTileLayer
                        key={`paradas-${paradaFiltro}-${isAuthenticated}`}
                        eventHandlers={{ add: () => setParadaVisible(true), remove: () => setParadaVisible(false) }}
                        url={WMS_URL}
                        layers="tsig:parada"
                        styles="tsig:parada_condicional"
                        format="image/png"
                        transparent={true}
                        tileSize={DEFAULT_TILE_SIZE}
                        params={paradaCqlFilter ? ({ CQL_FILTER: paradaCqlFilter } as any) : {}}
                    />
                </LayersControl.Overlay>
            </LayersControl>

            {/* Filtro para líneas habilitadas/deshabilitadas - disponible para todos los usuarios */}
            {lineaVisible && (
                <div style={{ position: 'absolute', zIndex: 1000, left: 60, top: 60, background: 'rgba(255,255,255,0.9)', padding: 6, borderRadius: 6 }}>
                    <label style={{ marginRight: 8 }}>Ver líneas:</label>
                    <select
                        value={lineaFiltro}
                        onChange={e => setLineaFiltro(e.target.value as any)}
                        style={{ fontSize: 14 }}
                    >
                        <option value="todos">Todas</option>
                        <option value="habilitadas">Habilitadas</option>
                        <option value="deshabilitadas">Deshabilitadas</option>
                    </select>
                </div>
            )}

            {/* Filtro para paradas habilitadas/deshabilitadas - disponible para todos los usuarios */}
            {paradaVisible && (
                <div style={{ position: 'absolute', zIndex: 1000, left: 60, top: 10, background: 'rgba(255,255,255,0.9)', padding: 6, borderRadius: 6 }}>
                    <label style={{ marginRight: 8 }}>Ver paradas:</label>
                    <select
                        value={paradaFiltro}
                        onChange={e => setParadaFiltro(e.target.value as any)}
                        style={{ fontSize: 14 }}
                    >
                        <option value="todos">Todas</option>
                        <option value="habilitadas">Habilitadas</option>
                        <option value="deshabilitadas">Deshabilitadas</option>
                    </select>
                </div>
            )}

            <WMSFeatureInfoHandler
                visible={paradaVisible}
                layerName="tsig:parada"
                tolerance={12}
                onFeatureInfo={data => {
                    if (data && data.features && data.features.length > 0) {
                        const parada = data.features[0]
                        const props = data.features[0].properties
                        const paradaId = parada.id.split('.')[1]

                        const [x, y] = parada.geometry.coordinates
                        const latlng = L.CRS.EPSG3857.unproject(L.point(x, y))
                        setSelectedParada({
                            id: paradaId,
                            nombre: props.nombre,
                            estado: props.estado,
                            refugio: props.refugio,
                            observacion: props.observacion,
                            latitud: latlng.lat,
                            longitud: latlng.lng,
                        })
                        // Siempre cerrar el popup de línea cuando se selecciona una parada
                        setSelectedLinea(null)
                    } else {
                        setSelectedParada(null)
                    }
                }}
            />

            {/* Handler para clics en líneas */}
            <WMSFeatureInfoHandler
                visible={lineaVisible}
                layerName="tsig:linea"
                tolerance={12}
                styles={mapaBaseActivo === 'claro' ? 'tsig:lineas_claro' : 'tsig:lineas_oscuro'}
                onFeatureInfo={async data => {
                    if (data && data.features && data.features.length > 0) {
                        const lineaFeature = data.features[0]
                        const props = lineaFeature.properties
                        const lineaId = lineaFeature.id.split('.')[1]

                        try {
                            // Obtener la línea completa del servidor
                            const linea = await getLineById(parseInt(lineaId))
                            setSelectedLinea(linea)
                            // Siempre cerrar el popup de parada cuando se selecciona una línea
                            setSelectedParada(null)
                        } catch (error) {
                            console.error('Error al obtener la línea:', error)
                            // Fallback: crear LineaDTO básica con la info del WMS
                            setSelectedLinea({
                                id: parseInt(lineaId),
                                descripcion: props.descripcion || `Línea ${lineaId}`,
                                empresa: props.empresa || '',
                                observacion: props.observacion || '',
                                origen: props.origen || '',
                                destino: props.destino || '',
                                estaHabilitada: true, // Default value
                                puntos: [],
                                rutaGeoJSON: ''
                            })
                            setSelectedParada(null)
                        }
                    } else {
                        setSelectedLinea(null)
                    }
                }}
            />

            {/* Popups condicionales según autenticación */}
            {isAuthenticated ? (
                <>
                    <StopInfoPopupContainer
                        parada={selectedParada}
                        onClose={() => setSelectedParada(null)}
                        onMove={parada => {
                            if (onMoveStop) onMoveStop(parada)
                            setSelectedParada(null)
                        }}
                    />

                    <LineInfoPopupContainer
                        linea={selectedLinea}
                        onClose={() => setSelectedLinea(null)}
                        onModifyRoute={linea => {
                            if (onModifyLineRoute) onModifyLineRoute(linea)
                            setSelectedLinea(null)
                        }}
                        onShowStops={(lineaId, lineaDescripcion) => {
                            setShowLineStops({ lineaId, lineaDescripcion });
                        }}
                    />

                    {/* LineStopsPopup también disponible para usuarios autenticados */}
                    {showLineStops && (
                        <LineStopsPopup
                            lineaId={showLineStops.lineaId}
                            lineaDescripcion={showLineStops.lineaDescripcion}
                            onClose={() => setShowLineStops(null)}
                            onViewStop={onCenterMap}
                            onSelectStop={(parada: ParadaLineaDTO) => {
                                // Crear un ParadaDTO a partir de ParadaLineaDTO para mostrar el popup de parada
                                if (parada.nombreParada && parada.latitudParada && parada.longitudParada) {
                                    const paradaDTO: ParadaDTO = {
                                        id: parada.idParada,
                                        nombre: parada.nombreParada,
                                        estado: 1, // Asumimos habilitada por defecto
                                        refugio: false, // No tenemos esta info
                                        observacion: '', // No tenemos esta info
                                        latitud: parada.latitudParada,
                                        longitud: parada.longitudParada
                                    };
                                    setSelectedParada(paradaDTO);
                                    // Cerrar el popup de línea cuando se selecciona una parada
                                    setSelectedLinea(null);
                                    // Limpiar línea seleccionada del padre si existe la función
                                    if (onClearSelectedLine) {
                                        onClearSelectedLine();
                                    }
                                }
                            }}
                        />
                    )}
                </>
            ) : (
                <>
                    {selectedParada && (
                        <StopInfoReadOnlyPopup
                            parada={selectedParada}
                            onClose={() => setSelectedParada(null)}
                            onViewRoute={async (lineaId: number) => {
                                try {
                                    const linea = await getLineById(lineaId);
                                    setSelectedLinea(linea);
                                    // Cerrar el popup de parada y LineStopsPopup cuando se ve una línea
                                    setSelectedParada(null);
                                    setShowLineStops(null);
                                    
                                    // Usar onViewLine para pintar la línea y centrar el mapa
                                    if (onViewLine) {
                                        onViewLine(linea);
                                    }
                                } catch (error) {
                                    console.error('Error al obtener la línea:', error);
                                    alert('Error al cargar la información de la línea');
                                }
                            }}
                        />
                    )}

                    {selectedLinea && (
                        <LineInfoReadOnlyPopup
                            linea={selectedLinea}
                            onClose={() => setSelectedLinea(null)}
                            onShowStops={(lineaId, lineaDescripcion) => {
                                setShowLineStops({ lineaId, lineaDescripcion });
                            }}
                        />
                    )}

                    {showLineStops && (
                        <LineStopsPopup
                            lineaId={showLineStops.lineaId}
                            lineaDescripcion={showLineStops.lineaDescripcion}
                            onClose={() => setShowLineStops(null)}
                            onViewStop={onCenterMap}
                            onSelectStop={(parada: ParadaLineaDTO) => {
                                // Crear un ParadaDTO a partir de ParadaLineaDTO para mostrar el popup de parada
                                if (parada.nombreParada && parada.latitudParada && parada.longitudParada) {
                                    const paradaDTO: ParadaDTO = {
                                        id: parada.idParada,
                                        nombre: parada.nombreParada,
                                        estado: 1, // Asumimos habilitada por defecto
                                        refugio: false, // No tenemos esta info
                                        observacion: '', // No tenemos esta info
                                        latitud: parada.latitudParada,
                                        longitud: parada.longitudParada
                                    };
                                    setSelectedParada(paradaDTO);
                                    // Cerrar SOLO el popup de línea, mantener LineStopsPopup
                                    setSelectedLinea(null);
                                    // Limpiar la línea dibujada en el mapa (ocultar botón cancelar)
                                    if (onClearSelectedLine) {
                                        onClearSelectedLine();
                                    }
                                }
                            }}
                        />
                    )}
                </>
            )}
        </>
    )
}
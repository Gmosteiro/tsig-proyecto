import { TileLayer, WMSTileLayer, LayersControl } from 'react-leaflet'
import { useState, useEffect } from 'react'
import { ParadaDTO } from '../../services/api'
import WMSFeatureInfoHandler from './WMSFeatureInfoHandler'
import StopInfoPopupContainer from './StopInfoPopupContainer'
import { WMS_URL, DEFAULT_TILE_SIZE } from '../../lib/constants'
import { useAuth } from '../../context/authContext'
import L from 'leaflet'

export default function LayerController({ onMoveStop }: { onMoveStop?: (parada: ParadaDTO) => void }) {
    const { isAuthenticated } = useAuth()
    const [camineraVisible, setCamineraVisible] = useState(false)
    const [paradaVisible, setParadaVisible] = useState(true)
    const [lineaVisible, setLineaVisible] = useState(false)
    const [selectedParada, setSelectedParada] = useState<ParadaDTO | null>(null)
    const [paradaFiltro, setParadaFiltro] = useState<'todos' | 'habilitadas' | 'deshabilitadas'>('todos')
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

    // Obtener geolocalización para usuarios no autenticados
    // Esto permite aplicar filtros geográficos de proximidad
    useEffect(() => {
        if (!isAuthenticated) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude])
                },
                (error) => {
                    console.error("Error obteniendo geolocalización:", error)
                    // Si no se puede obtener geolocalización, se mantiene como null 
                    // y se muestran todos los resultados independientemente de la distancia
                }
            )
        }
    }, [isAuthenticated])

    /**
     * Construye el filtro CQL para paradas según el tipo de usuario:
     * - Usuarios no autenticados: filtro por estado (habilitadas/deshabilitadas) + filtro geográfico de 4km
     * - Usuarios admin autenticados: sin filtros (ven todo)
     * - Sin geolocalización: solo filtro por estado, sin restricción de distancia
     */
    const buildCqlFilter = () => {
        const filters = []

        // Para usuarios no autenticados, aplicar filtro de estado
        if (!isAuthenticated) {
            if (paradaFiltro === 'habilitadas') {
                filters.push('estado=0')
            } else if (paradaFiltro === 'deshabilitadas') {
                filters.push('estado=1')
            }
        }

        // Para usuarios no autenticados, aplicar filtro geográfico de 4km si hay geolocalización
        if (!isAuthenticated && userLocation) {
            const [lat, lng] = userLocation
            // Buffer de 4km = 4000 metros
            filters.push(`DWITHIN(ubicacion, POINT(${lng} ${lat}), 4000, meters)`)
        }

        return filters.length > 0 ? filters.join(' AND ') : undefined
    }

    const paradaCqlFilter = buildCqlFilter()

    /**
     * Construye el filtro CQL para líneas:
     * - Usuarios no autenticados: filtro geográfico de 4km si hay geolocalización
     * - Usuarios admin autenticados: sin filtros (ven todas las líneas)
     * - Sin geolocalización: sin filtros de distancia
     */
    const buildLineaCqlFilter = () => {
        if (!isAuthenticated && userLocation) {
            const [lat, lng] = userLocation
            // Buffer de 4km = 4000 metros
            return `DWITHIN(recorrido, POINT(${lng} ${lat}), 4000, meters)`
        }
        return undefined
    }

    const lineaCqlFilter = buildLineaCqlFilter()

    return (
        <>
            <LayersControl position="bottomright">
                <LayersControl.BaseLayer checked name="Mapa Base Claro">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Mapa Base Oscuro">
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                </LayersControl.BaseLayer>
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
                <LayersControl.Overlay name="Paradas" checked={paradaVisible}>
                    <>
                        {/* Solo mostrar filtro para usuarios no autenticados */}
                        {!isAuthenticated && (
                            <div style={{ position: 'absolute', zIndex: 1000, left: 60, top: 10, background: 'rgba(255,255,255,0.9)', padding: 6, borderRadius: 6 }}>
                                <label style={{ marginRight: 8 }}>Mostrar:</label>
                                <select
                                    value={paradaFiltro}
                                    onChange={e => setParadaFiltro(e.target.value as any)}
                                    style={{ fontSize: 14 }}
                                >
                                    <option value="todos">Todos</option>
                                    <option value="habilitadas">Habilitadas</option>
                                    <option value="deshabilitadas">Deshabilitadas</option>
                                </select>
                            </div>
                        )}
                        <WMSTileLayer
                            key={`${paradaFiltro}-${userLocation ? `${userLocation[0]}-${userLocation[1]}` : 'no-location'}-${isAuthenticated}`}
                            eventHandlers={{ add: () => setParadaVisible(true), remove: () => setParadaVisible(false) }}
                            url={WMS_URL}
                            layers="tsig:parada"
                            styles="Parada"
                            format="image/png"
                            transparent={true}
                            tileSize={DEFAULT_TILE_SIZE}
                            params={paradaCqlFilter ? ({ CQL_FILTER: paradaCqlFilter } as any) : {}}
                        />
                    </>
                </LayersControl.Overlay>
                <LayersControl.Overlay name="Líneas" checked={lineaVisible}>
                    <WMSTileLayer
                        key={`lineas-${userLocation ? `${userLocation[0]}-${userLocation[1]}` : 'no-location'}-${isAuthenticated}`}
                        eventHandlers={{ add: () => setLineaVisible(true), remove: () => setLineaVisible(false) }}
                        url={WMS_URL}
                        layers="tsig:linea"
                        format="image/png"
                        transparent={true}
                        tileSize={DEFAULT_TILE_SIZE}
                        params={lineaCqlFilter ? ({ CQL_FILTER: lineaCqlFilter } as any) : {}}
                    />
                </LayersControl.Overlay>
            </LayersControl>

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
                    } else {
                        setSelectedParada(null)
                    }
                }}
            />

            <StopInfoPopupContainer
                parada={selectedParada}
                onClose={() => setSelectedParada(null)}
                onMove={parada => {
                    if (onMoveStop) onMoveStop(parada)
                    setSelectedParada(null)
                }}
            />
        </>
    )
}
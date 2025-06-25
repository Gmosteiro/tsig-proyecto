import { TileLayer, WMSTileLayer, LayersControl } from 'react-leaflet'
import { useState } from 'react'
import { ParadaDTO } from '../../services/api'
import WMSFeatureInfoHandler from './WMSFeatureInfoHandler'
import StopInfoPopupContainer from './StopInfoPopupContainer'
import { WMS_URL, DEFAULT_TILE_SIZE } from '../../lib/constants'
import L from 'leaflet'

export default function LayerController({ onMoveStop }: { onMoveStop?: (parada: ParadaDTO) => void }) {
    const [camineraVisible, setCamineraVisible] = useState(false)
    const [paradaVisible, setParadaVisible] = useState(true)
    const [lineaVisible, setLineaVisible] = useState(false)
    const [selectedParada, setSelectedParada] = useState<ParadaDTO | null>(null)
    const [paradaFiltro, setParadaFiltro] = useState<'todos' | 'habilitadas' | 'deshabilitadas'>('todos')

    // CQL_FILTER según filtro seleccionado
    const paradaCqlFilter =
        paradaFiltro === 'habilitadas'
            ? 'estado=0'
            : paradaFiltro === 'deshabilitadas'
                ? 'estado=1'
                : undefined

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
                        <WMSTileLayer
                            key={paradaFiltro}
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
                        eventHandlers={{ add: () => setLineaVisible(true), remove: () => setLineaVisible(false) }}
                        url={WMS_URL}
                        layers="tsig:linea"
                        format="image/png"
                        transparent={true}
                        tileSize={DEFAULT_TILE_SIZE}
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
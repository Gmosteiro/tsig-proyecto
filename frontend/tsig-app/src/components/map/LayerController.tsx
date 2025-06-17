import { TileLayer, WMSTileLayer, LayersControl } from 'react-leaflet'
import { useState } from 'react'
import { ParadaDTO } from '../../services/api'
import WMSFeatureInfoHandler from './WMSFeatureInfoHandler'
import StopInfoPopupContainer from './StopInfoPopupContainer'
import { WMS_URL, DEFAULT_TILE_SIZE } from '../../lib/contants'

export default function LayerController() {
    const [camineraVisible, setCamineraVisible] = useState(true)
    const [paradaVisible, setParadaVisible] = useState(false)
    const [lineaVisible, setLineaVisible] = useState(false)
    const [selectedParada, setSelectedParada] = useState<ParadaDTO | null>(null)

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
                    <WMSTileLayer
                        eventHandlers={{ add: () => setParadaVisible(true), remove: () => setParadaVisible(false) }}
                        url={WMS_URL}
                        layers="tsig:parada"
                        styles="Parada"
                        format="image/png"
                        transparent={true}
                        tileSize={DEFAULT_TILE_SIZE}
                    />
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
                    console.log('Feature info for paradas:', data)
                    if (data && data.features && data.features.length > 0) {
                        const props = data.features[0].properties
                        setSelectedParada({
                            id: props.id,
                            nombre: props.nombre,
                            estado: props.estado,
                            refugio: props.refugio,
                            observacion: props.observacion,
                            latitud: props.latitud,
                            longitud: props.longitud,
                        })
                    } else {
                        setSelectedParada(null)
                    }
                }}
            />

            <WMSFeatureInfoHandler
                visible={lineaVisible}
                layerName="tsig:linea"
                tolerance={8}
                onFeatureInfo={(data) => {
                    console.log('Feature info for lineas:', data)
                }}
            />

            <StopInfoPopupContainer parada={selectedParada} onClose={() => setSelectedParada(null)} />
        </>
    )
}
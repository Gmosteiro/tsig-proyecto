import { TileLayer, WMSTileLayer, LayersControl, useMapEvent, useMap } from 'react-leaflet'
import { useState } from 'react'
import { getWMSFeatureInfo, ParadaDTO } from '../../services/api'
import EditStopPopup from './EditStopPopup';
import { WMS_URL, DEFAULT_TILE_SIZE } from '../../lib/contants';

function WMSFeatureInfoHandler({
    visible,
    layerName,
    infoFormat = "application/json",
    tolerance = 5,
    onFeatureInfo
}: {
    visible: boolean,
    layerName: string,
    infoFormat?: string,
    tolerance?: number,
    onFeatureInfo: (data: any) => void
}) {
    const map = useMap();

    useMapEvent('click', async (e) => {
        const popup = document.querySelector('.edit-stop-popup');
        if (popup && e.originalEvent && popup.contains(e.originalEvent.target as Node)) {
            return;
        }

        if (!visible) return;

        const size = map.getSize();
        const bounds = map.getBounds();
        const crs = map.options.crs;
        if (!crs) {
            onFeatureInfo(null);
            return;
        }
        const point = map.latLngToContainerPoint(e.latlng);

        // Construir bbox
        const sw = crs.project(bounds.getSouthWest());
        const ne = crs.project(bounds.getNorthEast());
        const bbox = [sw.x, sw.y, ne.x, ne.y].join(',');

        try {
            const data = await getWMSFeatureInfo({
                layerName,
                crsCode: crs.code ?? "",
                bbox,
                size,
                point,
                infoFormat,
                tolerance
            });
            onFeatureInfo(data);
        } catch (err) {
            onFeatureInfo(null);
        }
    });

    return null;
}

export default function LayerController() {
    const [camineraVisible, setCamineraVisible] = useState(true);
    const [paradaVisible, setParadaVisible] = useState(false);
    const [lineaVisible, setLineaVisible] = useState(false);
    const [info, setInfo] = useState<ParadaDTO | null>(null);

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
                    if (data && data.features && data.features.length > 0) {
                        const props = data.features[0].properties;
                        const parada: ParadaDTO = {
                            id: props.id,
                            nombre: props.nombre,
                            estado: props.estado,
                            refugio: props.refugio,
                            observacion: props.observacion,
                            latitud: props.latitud,
                            longitud: props.longitud,
                        };
                        setInfo(parada);
                    } else {
                        setInfo(null);
                    }
                }}
            />
            <WMSFeatureInfoHandler
                visible={lineaVisible}
                layerName="tsig:linea"
                tolerance={8}
                onFeatureInfo={data => setInfo(data)}
            />

            <EditStopPopup stop={info} onClose={() => setInfo(null)} />
        </>
    )
}
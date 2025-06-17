import { TileLayer, WMSTileLayer, LayersControl, useMapEvent, useMap } from 'react-leaflet'
import { useState } from 'react'
import { getWMSFeatureInfo } from '../../services/api'
import EditStopPopup from './EditStopPopup';

function WMSFeatureInfoHandler({
    visible,
    layerName,
    infoFormat = "application/json",
    tolerance = 5, // margen en pixeles
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
        // Ignorar clicks si el popup está abierto y el click fue sobre el popup
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
    const [info, setInfo] = useState<any>(null);

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
                        url='http://localhost:8080/geoserver/wms'
                        layers="tsig:ft_caminera_nacional"
                        format="image/png"
                        transparent={true}
                        tileSize={256}
                    />
                </LayersControl.Overlay>
                <LayersControl.Overlay name="Paradas" checked={paradaVisible}>
                    <WMSTileLayer
                        eventHandlers={{ add: () => setParadaVisible(true), remove: () => setParadaVisible(false) }}
                        url='http://localhost:8080/geoserver/wms'
                        layers="tsig:parada"
                        styles="Parada"
                        format="image/png"
                        transparent={true}
                        tileSize={256}
                    />
                </LayersControl.Overlay>
                <LayersControl.Overlay name="Líneas" checked={lineaVisible}>
                    <WMSTileLayer
                        eventHandlers={{ add: () => setLineaVisible(true), remove: () => setLineaVisible(false) }}
                        url='http://localhost:8080/geoserver/wms'
                        layers="tsig:linea"
                        format="image/png"
                        transparent={true}
                        tileSize={256}
                    />
                </LayersControl.Overlay>
            </LayersControl>

            {/* Handlers para GetFeatureInfo */}
            <WMSFeatureInfoHandler
                visible={paradaVisible}
                layerName="tsig:parada"
                tolerance={12}
                onFeatureInfo={data => setInfo(data)}
            />
            <WMSFeatureInfoHandler
                visible={lineaVisible}
                layerName="tsig:linea"
                tolerance={8}
                onFeatureInfo={data => setInfo(data)}
            />

            <EditStopPopup info={info} onClose={() => setInfo(null)} />
        </>
    )
}
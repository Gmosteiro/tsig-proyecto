import { TileLayer, WMSTileLayer, LayersControl, useMapEvent, useMap } from 'react-leaflet'
import { useState } from 'react'

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
        const sw = crs.project(bounds.getSouthWest()); // project to EPSG:3857
        const ne = crs.project(bounds.getNorthEast());
        const bbox = [sw.x, sw.y, ne.x, ne.y].join(',');

        // Construir URL GetFeatureInfo
        const url = new URL('http://localhost:8080/geoserver/wms');
        url.search = new URLSearchParams({
            SERVICE: 'WMS',
            VERSION: '1.1.1',
            REQUEST: 'GetFeatureInfo',
            FORMAT: 'image/png',
            TRANSPARENT: 'true',
            QUERY_LAYERS: layerName,
            LAYERS: layerName,
            STYLES: '',
            SRS: crs.code,
            BBOX: bbox,
            WIDTH: size.x.toString(),
            HEIGHT: size.y.toString(),
            INFO_FORMAT: infoFormat,
            X: Math.round(point.x).toString(),
            Y: Math.round(point.y).toString(),
            FEATURE_COUNT: '5',
            BUFFER: tolerance.toString()
        } as Record<string, string>).toString();

        try {
            const resp = await fetch(url.toString());
            const data = await resp.json();
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
    const [info, setInfo] = useState<any>(null);

    // Handlers para mostrar/ocultar capas

    return (
        <>
            <LayersControl position="bottomright">
                <LayersControl.BaseLayer checked name="Mapa Base">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
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
                <LayersControl.Overlay name="Departamentos">
                    <WMSTileLayer
                        url='http://localhost:8080/geoserver/wms'
                        layers="tsig:ft_departamentos"
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

            {/* Mostrar información */}
            {info && (
                <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'white', zIndex: 1000, maxWidth: 400 }}>
                    <pre>{JSON.stringify(info, null, 2)}</pre>
                </div>
            )}
        </>
    )
}
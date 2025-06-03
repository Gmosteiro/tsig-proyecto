import { TileLayer, WMSTileLayer, LayersControl } from 'react-leaflet'


export default function LayerController() {

    return (
        <>
            <LayersControl position="bottomright">
                <LayersControl.BaseLayer checked name="Mapa Base">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.Overlay name="Caminera Nacional">
                    <WMSTileLayer
                        url='http://localhost:8080/geoserver/wms'
                        layers="tsig:ft_caminera_nacional"
                        format="image/png"
                        transparent={true}
                        tileSize={256}
                    />
                </LayersControl.Overlay>
                <LayersControl.Overlay name="Paradas">
                    <WMSTileLayer
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
        </>
    )
}   
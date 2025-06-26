import { MapContainer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import NavigationBar from '../components/ui/NavigationBar';
import Footer from '../components/ui/Footer';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { LineaDTO, updateGeoJSON, getLinesByGeoJson } from '../services/linea';
import Searcher from '../components/search/Searcher';
import PolygonDrawControl from '../components/map/PolygonDrawControl';
import LayerController from '../components/map/LayerController';
import React from 'react';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function SimpleMapPage() {
  const [position, setPosition] = useState<[number, number]>([-32.5, -56.0]); // Centro de Uruguay
  const [hasUserLocation, setHasUserLocation] = useState(false); // Para saber si se obtuvo geolocalización
  const [selectedLinea, setSelectedLinea] = useState<any | null>(null);
  const [showSearcher, setShowSearcher] = useState(false);
  const [polygonCoords, setPolygonCoords] = useState<[number, number][]>([]);
  const [polygonLines, setPolygonLines] = useState<any[] | null>(null);
  const [drawingPolygon, setDrawingPolygon] = useState(false);
  const mapRef = useRef<any>(null);
  const featureGroupRef = useRef<any>(null);

  useEffect(() => {
    if (selectedLinea && selectedLinea.rutaGeoJSON && mapRef.current) {
      try {
        const geojson = JSON.parse(selectedLinea.rutaGeoJSON)
        const coords = geojson.coordinates.flat(1)
        const latlngs = coords.map(([lng, lat]: [number, number]) => [lat, lng])
        if (latlngs.length > 0) {
          // Centrar el mapa en la nueva línea
          mapRef.current.fitBounds(latlngs)
          console.log('Mapa centrado en línea:', selectedLinea.descripcion)
        }
      } catch (error) {
        console.error('Error al procesar GeoJSON de la línea:', error)
      }
    }
  }, [selectedLinea?.id, selectedLinea?.rutaGeoJSON]); // Dependencias más específicas

  const handleCancelPolygon = () => {
    setDrawingPolygon(false)
    setPolygonLines(null)
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers()
    }
    setPolygonCoords([])
  }

  function SetMapRef({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
    const map = useMap();
    React.useEffect(() => {
      mapRef.current = map;
    }, [map, mapRef]);
    return null;
  }

  const handleCreated = async (e: any) => {
    if (e.layerType === 'polygon') {
      const latlngs = e.layer.getLatLngs()[0].map((latlng: any) => [latlng.lat, latlng.lng]);
      setPolygonCoords(latlngs);

      const geoJson = e.layer.toGeoJSON();

      const lines = await getLinesByGeoJson(geoJson);
      setPolygonLines(lines);
      setShowSearcher(false); // Oculta el buscador normal si está abierto
      setDrawingPolygon(false); // Ya no estamos dibujando

      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
      }
      setPolygonCoords([]);
    }
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(latlng);
        setHasUserLocation(true);
      },
      (err) => {
        console.error("Error obteniendo geolocalización:", err);
        // Mantener la posición por defecto de Uruguay [-32.5, -56.0]
        setHasUserLocation(false);
      }
    );
  }, []);

  return (
    <div className="min-h-screen">
      <NavigationBar />

      <div className="flex justify-center my-6">
        {(showSearcher || polygonLines) && (
          <div className="w-full max-w-4xl mx-auto px-4">
            <Searcher
              onVerLinea={async (data: LineaDTO) => {
                const line = await updateGeoJSON(data);
                setSelectedLinea(line);
                setShowSearcher(false);
                setPolygonLines(null);
              }}
              initialLines={polygonLines}
            />
          </div>
        )}
      </div>

      {!drawingPolygon && (
        <div className="flex gap-2 justify-center my-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
            onClick={() => setShowSearcher(v => !v)}
          >
            {showSearcher ? "Ocultar Buscador" : "Buscar Rutas"}
          </button>
          {/* <button
            className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer"
            onClick={() => setDrawingPolygon(true)}
          >
            Filtrar por Área
          </button> */}
          {(showSearcher || selectedLinea || polygonLines) && (
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded cursor-pointer"
              onClick={() => {
                setShowSearcher(false);
                setSelectedLinea(null);
                setPolygonLines(null);
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      )}

      {drawingPolygon && (
        <div className="flex gap-2 justify-center my-4">
          <div className="bg-blue-100 border border-blue-300 px-4 py-2 rounded">
            <span className="text-blue-800">Dibuja un polígono en el mapa para filtrar rutas por área</span>
          </div>
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded cursor-pointer"
            onClick={handleCancelPolygon}
          >
            Cancelar
          </button>
        </div>
      )}

      {position ? (
        <MapContainer
          center={position}
          zoom={hasUserLocation ? 13 : 7} // Zoom 13 si hay geolocalización (~4km radio), zoom 7 para todo Uruguay
          scrollWheelZoom={true}
          style={{ height: '75vh', width: '100%' }}
        >
          <SetMapRef mapRef={mapRef} />
          <LayerController 
            selectedLineaFromParent={selectedLinea}
            onViewLine={async (linea: LineaDTO) => {
              console.log('onViewLine llamado para línea:', linea.descripcion, 'ID:', linea.id);
              try {
                // Limpiar línea anterior si existe
                if (selectedLinea && selectedLinea.id !== linea.id) {
                  console.log('Limpiando línea anterior:', selectedLinea.descripcion);
                  setSelectedLinea(null);
                  // Esperar un tick para asegurar que el estado se limpie
                  await new Promise(resolve => setTimeout(resolve, 0));
                }
                
                const line = await updateGeoJSON(linea);
                console.log('Línea actualizada con GeoJSON:', line.descripcion);
                setSelectedLinea(line);
              } catch (error) {
                console.error('Error al actualizar línea:', error);
              }
            }}
            onCenterMap={(latitud: number, longitud: number, zoom?: number) => {
              console.log('SimpleMapPage - Centrando mapa en:', latitud, longitud, 'zoom:', zoom);
              if (mapRef.current) {
                mapRef.current.setView([latitud, longitud], zoom || 16);
                console.log('Mapa centrado exitosamente');
              } else {
                console.warn('mapRef.current no disponible');
              }
            }}
            onClearSelectedLine={() => {
              console.log('Limpiando línea seleccionada');
              setSelectedLinea(null);
            }}
          />
          {/* Mostrar marcador de ubicación solo si se obtuvo geolocalización */}
          {hasUserLocation && (
            <Marker position={position} icon={customIcon}>
              <Popup>¡Estás aquí!</Popup>
            </Marker>
          )}

          {/* Línea seleccionada desde el buscador */}
          {selectedLinea && selectedLinea.rutaGeoJSON && (
            <GeoJSON
              key={`selected-line-${selectedLinea.id}`}
              data={JSON.parse(selectedLinea.rutaGeoJSON)}
              style={{ color: 'blue', weight: 5, opacity: 0.9 }}
            />
          )}

          {/* Líneas encontradas por polígono */}
          {polygonLines && polygonLines.map((linea: any, idx: number) => (
            <GeoJSON
              key={idx}
              data={JSON.parse(linea.rutaGeoJSON)}
              style={{ color: 'red', weight: 3, opacity: 0.8 }}
            >
              <Popup>
                <strong>Línea:</strong> {linea.descripcion}<br />
                <strong>Empresa:</strong> {linea.empresa}<br />
                <strong>Origen:</strong> {linea.origen}<br />
                <strong>Destino:</strong> {linea.destino}
              </Popup>
            </GeoJSON>
          ))}

          <PolygonDrawControl
            featureGroupRef={featureGroupRef}
            polygonCoords={polygonCoords}
            setPolygonCoords={setPolygonCoords}
            handleCreated={handleCreated}
          />

        </MapContainer>
      ) : (
        <div className="text-center text-gray-600 mt-10">Cargando ubicación...</div>
      )}

      <Footer />
    </div>
  );
}

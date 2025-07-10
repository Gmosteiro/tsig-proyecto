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
import { useWMSFilters } from '../hooks/useWMSFilters';
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
  const [searchType, setSearchType] = useState<'origenDestino' | 'nombre' | 'horario' | 'kilometro' | 'poligono' | null>(null); // Estado para mantener el tipo de búsqueda
  
  // Hook para manejar filtros WMS
  const { 
    aplicarFiltrosPorIdsLineas, 
    limpiarFiltrosWMSLocal, 
    filtrosWMS 
  } = useWMSFilters();
  
  // Estado para manejar los resultados de búsqueda actuales
  const [resultadosBusqueda, setResultadosBusqueda] = useState<LineaDTO[]>([]);
  
  // Función para manejar cuando hay nuevos resultados de búsqueda
  const handleResultadosBusqueda = (lineas: LineaDTO[]) => {
    setResultadosBusqueda(lineas);
    
    // Si hay resultados, aplicar filtros WMS
    if (lineas.length > 0) {
      const idsLineas = lineas.map(linea => linea.id).filter((id): id is number => id !== undefined);
      aplicarFiltrosPorIdsLineas(idsLineas);
    } else {
      // Si no hay resultados, aplicar filtros que oculten todo (no mostrar nada)
      aplicarFiltrosPorIdsLineas([]); // Lista vacía = filtros que ocultan todo
    }
  };
  
  // Función para limpiar búsqueda y filtros completamente (mostrar todo)
  const handleLimpiarBusquedaCompleta = () => {
    setResultadosBusqueda([]);
    limpiarFiltrosWMSLocal(); // Esto remove los filtros completamente, mostrando todo
  };
  
  // Estados para mantener los valores de cada tipo de búsqueda
  const [rutaKilometroState, setRutaKilometroState] = useState({
    ruta: '',
    kilometro: '',
    resultados: [] as any[]
  });
  
  const [polygonCoords, setPolygonCoords] = useState<[number, number][]>([]);
  const [polygonLines, setPolygonLines] = useState<any[] | null>(null);
  const [drawingPolygon, setDrawingPolygon] = useState(false);
  const mapRef = useRef<any>(null);
  const featureGroupRef = useRef<any>(null);
  const hasMapBeenCentered = useRef(false); // Flag global para evitar re-centrado

  useEffect(() => {
    if (selectedLinea && selectedLinea.rutaGeoJSON && mapRef.current) {
      try {
        const geojson = JSON.parse(selectedLinea.rutaGeoJSON)
        const coords = geojson.coordinates.flat(1)
        const latlngs = coords.map(([lng, lat]: [number, number]) => [lat, lng])
        if (latlngs.length > 0) {
          // Centrar el mapa en la nueva línea
          mapRef.current.fitBounds(latlngs)
        }
      } catch (error) {
        console.error('Error al procesar GeoJSON de la línea:', error)
      }
    }
  }, [selectedLinea?.id, selectedLinea?.rutaGeoJSON]); // Dependencias más específicas

  // Efecto para sincronizar los resultados de polígono con los filtros WMS
  useEffect(() => {
    if (polygonLines && polygonLines.length > 0 && searchType === 'poligono') {
      handleResultadosBusqueda(polygonLines);
    }
  }, [polygonLines, searchType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancelPolygon = () => {
    setDrawingPolygon(false)
    setPolygonLines(null)
    setSearchType(null) // Limpiar el tipo de búsqueda
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers()
    }
    setPolygonCoords([])
    // Limpiar filtros WMS completamente (mostrar todo)
    handleLimpiarBusquedaCompleta()
  }

  const handleEnablePolygonDraw = () => {
    setDrawingPolygon(true)
    // Limpiar resultados de polígono anteriores
    setPolygonLines(null)
    // Limpiar el polígono actual del mapa
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers()
    }
    setPolygonCoords([])
  }

  const handleSearchTypeChange = (type: 'origenDestino' | 'nombre' | 'horario' | 'kilometro' | 'poligono' | null) => {
    // Si se cambia de filtro, limpiar el polígono
    if (type !== 'poligono') {
      setDrawingPolygon(false)
      setPolygonLines(null)
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers()
      }
      setPolygonCoords([])
    }
    
    // Si se cambia el tipo de búsqueda, limpiar filtros WMS anteriores completamente
    if (type !== searchType) {
      handleLimpiarBusquedaCompleta()
    }
    
    setSearchType(type)
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
      setSearchType('poligono'); // Establecer el tipo de búsqueda para polígono
      setShowSearcher(true); // Asegurar que el buscador esté visible con los resultados
      setDrawingPolygon(false); // Ya no estamos dibujando

      // Aplicar filtros WMS para las líneas encontradas por polígono
      if (lines.length > 0) {
        const idsLineas = lines.map((linea: LineaDTO) => linea.id).filter((id): id is number => id !== undefined);
        aplicarFiltrosPorIdsLineas(idsLineas);
        setResultadosBusqueda(lines);
      } else {
        // Si no hay líneas en el polígono, aplicar filtros que oculten todo
        aplicarFiltrosPorIdsLineas([]);
        setResultadosBusqueda([]);
      }

      // Limpiar el layer del mapa ya que mostraremos las líneas encontradas
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

  // Componente auxiliar para manejar el centrado inicial del mapa
  function MapCenterController({ position, hasUserLocation }: { position: [number, number], hasUserLocation: boolean }) {
    const map = useMap();

    useEffect(() => {
      // Solo centrar una vez cuando se obtiene la geolocalización del usuario
      if (hasUserLocation && !hasMapBeenCentered.current) {
        map.setView(position, 13); // Zoom más alto para ubicación del usuario
        hasMapBeenCentered.current = true;
      }
    }, [map, position, hasUserLocation]);

    return null;
  }

  return (
    <div className="min-h-screen">
      <NavigationBar />

      <div className="flex justify-center my-6">
        {showSearcher && (
          <div className="w-full max-w-4xl mx-auto px-4">
            <Searcher
              onVerLinea={async (data: LineaDTO) => {
                const line = await updateGeoJSON(data);
                setSelectedLinea(line);
                // No cerrar el buscador al hacer clic en "Ver"
                // setShowSearcher(false);
                
                // Solo limpiar polygonLines si NO estamos en modo polígono
                if (searchType !== 'poligono') {
                  setPolygonLines(null);
                }
              }}
              onResultadosBusqueda={handleResultadosBusqueda}
              initialLines={polygonLines}
              searchType={searchType}
              onSearchTypeChange={handleSearchTypeChange}
              // Props para el estado de RutaKilometro
              rutaKilometroState={rutaKilometroState}
              onRutaKilometroStateChange={setRutaKilometroState}
              // Props para el polígono
              onEnablePolygonDraw={handleEnablePolygonDraw}
              polygonLines={polygonLines}
            />
          </div>
        )}
      </div>

      {!drawingPolygon && (
        <div className="flex gap-2 justify-center my-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
            onClick={() => {
              if (showSearcher) {
                // Si está visible, solo ocultarlo (mantener filtros activos)
                setShowSearcher(false);
              } else {
                // Si está oculto, mostrarlo
                setShowSearcher(true);
                // Si hay resultados de polígono pero no hay tipo de búsqueda, restaurarlo
                if (polygonLines && polygonLines.length > 0 && !searchType) {
                  setSearchType('poligono');
                }
              }
            }}
          >
            {showSearcher ? "Ocultar Buscador" : "Buscar Rutas"}
          </button>
          {(showSearcher || selectedLinea || polygonLines) && (
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded cursor-pointer"
              onClick={() => {
                // El botón cancelar cierra el buscador y limpia todo
                setShowSearcher(false);
                setSearchType(null); // Limpiar el tipo de búsqueda
                setSelectedLinea(null);
                setPolygonLines(null);
                setDrawingPolygon(false);
                // Limpiar el polígono del mapa
                if (featureGroupRef.current) {
                  featureGroupRef.current.clearLayers();
                }
                setPolygonCoords([]);
                // Limpiar filtros WMS completamente (mostrar todo)
                handleLimpiarBusquedaCompleta();
                // Limpiar todos los estados de búsqueda
                setRutaKilometroState({
                  ruta: '',
                  kilometro: '',
                  resultados: []
                });
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
          <MapCenterController position={position} hasUserLocation={hasUserLocation} />
          <LayerController 
            selectedLineaFromParent={selectedLinea}
            filtrosWMSExternos={filtrosWMS || undefined}
            onViewLine={async (linea: LineaDTO) => {
              try {
                // Limpiar línea anterior si existe
                if (selectedLinea && selectedLinea.id !== linea.id) {
                  setSelectedLinea(null);
                  // Esperar un tick para asegurar que el estado se limpie
                  await new Promise(resolve => setTimeout(resolve, 0));
                }
                
                const line = await updateGeoJSON(linea);
                setSelectedLinea(line);
              } catch (error) {
                console.error('Error al actualizar línea:', error);
              }
            }}
            onCenterMap={(latitud: number, longitud: number, zoom?: number) => {
              if (mapRef.current) {
                mapRef.current.setView([latitud, longitud], zoom || 16);
              }
            }}
            onClearSelectedLine={() => {
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
          {polygonLines && polygonLines.length === 1 && polygonLines[0].rutaGeoJSON && (
            <GeoJSON
              key={`polygon-single-line-${polygonLines[0].id}`}
              data={JSON.parse(polygonLines[0].rutaGeoJSON)}
              style={{ color: 'red', weight: 3, opacity: 0.8 }}
            >
              <Popup>
                <strong>Línea:</strong> {polygonLines[0].descripcion}<br />
                <strong>Empresa:</strong> {polygonLines[0].empresa}<br />
                <strong>Origen:</strong> {polygonLines[0].origen}<br />
                <strong>Destino:</strong> {polygonLines[0].destino}
              </Popup>
            </GeoJSON>
          )}
          {polygonLines && polygonLines.length > 1 && polygonLines.map((linea: any, idx: number) => (
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
            autoEnable={drawingPolygon}
          />

        </MapContainer>
      ) : (
        <div className="text-center text-gray-600 mt-10">Cargando ubicación...</div>
      )}

      <Footer />
    </div>
  );
}

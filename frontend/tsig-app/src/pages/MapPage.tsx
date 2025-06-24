import { MapContainer, Marker, useMapEvents, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import React, { useState, useRef, useEffect } from 'react'
import L from 'leaflet'
import RoutingControl from '../components/map/RoutingControl'
import PointControls from '../components/map/PointsControls'
import { v4 as uuidv4 } from 'uuid'
import { createStop, getWMSFeatureInfo, deleteStop, CrearParadaDTO, updateStop } from '../services/api'
import { validateRoute, saveLine, LineaDTO, updateGeoJSON, getLinesByGeoJson } from '../services/linea'
import StopMarker from '../components/map/StopMarker'
import useMapData from '../hooks/useMapData'
import NavigationBar from '../components/ui/NavigationBar'
import Footer from '../components/ui/Footer'
import markerIcon from '../assets/marker-icon.png'
import markerIconRed from '../assets/marker-icon-red.png'
import markerShadow from '../assets/marker-shadow.png'
import LayerController from '../components/map/LayerController'
import RouteForm from '../components/ui/RouteForm'
import StopForm from '../components/map/StopForm'
import Searcher from '../components/search/Searcher'
import { useMap } from 'react-leaflet'
import EditStopPopup from '../components/map/EditStopPopup'
import PolygonDrawControl from '../components/map/PolygonDrawControl'

export default function MapPage() {
  const { stops } = useMapData()
  const [creatingStop, setCreatingStop] = useState(false)
  const [addingRoute, setAddingRoute] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const [showRouteForm, setShowRouteForm] = useState(false)
  const [points, setPoints] = useState<{ id: string, lat: number, lng: number }[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null)
  const [editingStop, setEditingStop] = useState<any | null>(null);
  const [deleteStopMode, setDeleteStopMode] = useState(false);
  const [selectedLinea, setSelectedLinea] = useState<any | null>(null)
  const [showSearcher, setShowSearcher] = useState(false);
  const latestRouteGeoJSON = useRef<any>(null)
  const mapRef = useRef<any>(null)
  const featureGroupRef = useRef<any>(null)
  const [movingStop, setMovingStop] = useState<any | null>(null);
  const [polygonCoords, setPolygonCoords] = useState<[number, number][]>([])
  const [polygonLines, setPolygonLines] = useState<any[] | null>(null)

  useEffect(() => {
    if (selectedLinea && selectedLinea.rutaGeoJSON && mapRef.current) {
      const geojson = JSON.parse(selectedLinea.rutaGeoJSON)
      const coords = geojson.coordinates.flat(1)
      const latlngs = coords.map(([lng, lat]: [number, number]) => [lat, lng])
      if (latlngs.length > 0) {
        mapRef.current.fitBounds(latlngs)
      }
    }
  }, [selectedLinea])


  const handleCreateStop = async (stopData: CrearParadaDTO) => {
    await createStop(stopData)
    setCreatingStop(false)
  }

  const handleAddPoint = (latlng: [number, number]) => {
    setPoints(prev => [...prev, { id: uuidv4(), lat: latlng[0], lng: latlng[1] }])
  }

  const handleMarkerDrag = (idx: number, e: any) => {
    const { lat, lng } = e.target.getLatLng()
    setPoints(prev =>
      prev.map((p, i) => i === idx ? { ...p, lat, lng } : p)
    )
  }

  const handleDeleteSelected = () => {
    if (selectedIdx !== null) {
      setPoints(prev => prev.filter((_, idx) => idx !== selectedIdx))
      setSelectedIdx(null)
    }
  }

  const handleVerifyRoute = async () => {
    setRouteGeoJSON(null);
    const payload = {
      points: points.map(pt => ({ latitud: pt.lat, longitud: pt.lng }))
    };
    try {
      const response = await validateRoute(payload);
      if (typeof response === 'string' && response.includes('OK')) {
        if (!latestRouteGeoJSON.current) {
          alert("No se pudo obtener la ruta calculada (GeoJSON no disponible).");
          return;
        }
        setRouteGeoJSON(latestRouteGeoJSON.current);
        setIsValidated(true);
        setShowRouteForm(true);
      } else if (response && response.ok) {
        setIsValidated(true);
        setShowRouteForm(true);
      } else {
        setIsValidated(true);
        setShowRouteForm(true);
      }
    } catch (err: any) {
      alert('Error: ' + (err?.response?.data || err.message));
      setIsValidated(false);
      setShowRouteForm(false);
    }
  }

  const handleSaveRoute = async (formData: any) => {
    if (!routeGeoJSON) {
      alert("No se pudo obtener la ruta calculada. Intente verificar la ruta nuevamente.");
      return;
    }
    const lineData = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      empresa: formData.empresa,
      observacion: formData.observacion,
      puntos: points.map(pt => ({ latitud: pt.lat, longitud: pt.lng })),
      rutaGeoJSON: JSON.stringify(routeGeoJSON)
    };

    try {
      await saveLine(lineData)
      alert('Ruta guardada correctamente')
      setAddingRoute(false)
      setPoints([])
      setSelectedIdx(null)
      setRouteGeoJSON(null)
      setIsValidated(false)
      setShowRouteForm(false)
    } catch (err: any) {
      alert('Error al guardar la ruta: ' + (err?.response?.data || err.message))
    }
  }

  const handleCancelValidation = () => {
    setIsValidated(false)
    setRouteGeoJSON(null)
    setShowRouteForm(false)
  }

  const handleCancelAddRoute = () => {
    setAddingRoute(false)
    setPoints([])
    setSelectedIdx(null)
    setRouteGeoJSON(null)
    setIsValidated(false)
    setShowRouteForm(false)
  }

  // Handler para guardar cambios de parada
  const handleEditStop = async (stopData: any) => {
    console.log("Parada editada:", stopData);
    setEditingStop(null);
  };

  // Handler para mover parada
  const handleMoveStop = (stopData: any) => {
    setMovingStop(stopData);
    setEditingStop(null);
  };

  // Handler para actualizar la parada con la nueva posición
  const handleMoveStopSubmit = async (stopData: any) => {
    try {
      await updateStop(stopData);
    } catch (err: any) {
      alert("Error al mover la parada: " + (err?.response?.data || err.message));
    }
    setMovingStop(null);
  };

  function DeleteStopControl() {
    useMapEvents({
      click: async (e) => {
        if (!deleteStopMode) return;

        try {
          const map = e.target;
          const size = map.getSize();
          const bounds = map.getBounds();
          const crs = map.options.crs;
          const point = map.latLngToContainerPoint(e.latlng);
          const sw = crs.project(bounds.getSouthWest());
          const ne = crs.project(bounds.getNorthEast());
          const bbox = [sw.x, sw.y, ne.x, ne.y].join(',');

          const data = await getWMSFeatureInfo({
            layerName: "tsig:parada",
            crsCode: crs.code ?? "",
            bbox,
            size,
            point,
            infoFormat: "application/json",
            tolerance: 12
          });

          if (data && data.features && data.features.length > 0) {
            const parada = data.features[0];
            const nombre = parada.properties?.nombre;
            if (nombre) {
              // Llama a la API para borrar la parada
              await deleteStop(nombre);
              alert(`Parada "${nombre}" eliminada correctamente.`);
            } else {
              alert("No se encontró el nombre de la parada.");
            }
          } else {
            alert("No se encontró una parada en el lugar seleccionado.");
          }
        } catch (err: any) {
          alert("Error al intentar borrar la parada: " + (err?.response?.data || err.message));
        } finally {
          setDeleteStopMode(false);
        }
      }
    });
    return null;
  }

  function AddPointControl({ onAddPoint }: { onAddPoint: (latlng: [number, number]) => void }) {
    useMapEvents({
      click(e) {
        onAddPoint([e.latlng.lat, e.latlng.lng])
      }
    })
    return null
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

      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
      }
      setPolygonCoords([]);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavigationBar />
      <main className="flex-1">
        <div className="flex justify-center my-6">
          {(showSearcher || polygonLines) && (
            <Searcher
              onVerLinea={async (data: LineaDTO) => {
                const line = await updateGeoJSON(data);
                setSelectedLinea(line);
                setShowSearcher(false);
                setPolygonLines(null);
              }}
              initialLines={polygonLines}
            />
          )}
        </div>
        {!creatingStop && !addingRoute && (
          <div className="flex gap-2 justify-center my-4">
            <button
              className="bg-yellow-600 text-white px-4 py-2 rounded cursor-pointer"
              onClick={() => setCreatingStop(true)}
            >
              Crear Parada
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
              onClick={() => setAddingRoute(true)}
            >
              Crear Ruta
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
              onClick={() => setShowSearcher(v => !v)}
            >
              {showSearcher ? "Ocultar Buscador" : "Buscar Rutas"}
            </button>
            {(showSearcher || selectedLinea) && (
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded cursor-pointer"
                onClick={() => {
                  setShowSearcher(false);
                  setSelectedLinea(null);
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        )}

        {addingRoute && !showRouteForm && (
          <PointControls
            adding={addingRoute}
            setAdding={setAddingRoute}
            selectedIdx={selectedIdx}
            handleDeleteSelected={handleDeleteSelected}
            handleVerifyRoute={handleVerifyRoute}
            handleSaveRoute={() => setShowRouteForm(true)}
            pointsLength={points.length}
            handleCancelAdd={handleCancelAddRoute}
            isValidated={isValidated}
            handleCancelValidation={handleCancelValidation}
          />
        )}
        {addingRoute && isValidated && showRouteForm && (
          <RouteForm
            points={points.map(pt => [pt.lat, pt.lng])}
            onCancel={handleCancelValidation}
            onSave={handleSaveRoute}
          />
        )}

        <MapContainer
          center={[-34.9, -56.2]}
          zoom={13}
          style={{ height: '80vh', width: '100%' }}
        >
          <SetMapRef mapRef={mapRef} />
          <LayerController onMoveStop={handleMoveStop} />
          {creatingStop && (
            <StopForm
              onCancel={() => setCreatingStop(false)}
              onSubmit={handleCreateStop}
            />
          )}
          {addingRoute && !isValidated && <AddPointControl onAddPoint={handleAddPoint} />}
          {points.map((pt, idx) => (
            <Marker
              key={pt.id}
              position={[pt.lat, pt.lng]}
              draggable={addingRoute && !isValidated}
              eventHandlers={{
                dragend: (e) => addingRoute && !isValidated && handleMarkerDrag(idx, e),
                click: () => addingRoute && !isValidated && setSelectedIdx(idx)
              }}
              icon={L.icon({
                iconUrl: selectedIdx === idx ? markerIconRed : markerIcon,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: markerShadow,
                shadowSize: [41, 41]
              })}
            />
          ))}
          {addingRoute && points.length >= 2 && (
            <RoutingControl
              waypoints={points.map(pt => [pt.lat, pt.lng])}
              serviceUrl="https://router.project-osrm.org/route/v1"
              onRouteGeoJSON={geojson => {
                latestRouteGeoJSON.current = geojson;
                console.log("OSRM route GeoJSON:", geojson);
              }}
            />
          )}
          {editingStop && (
            <EditStopPopup
              parada={editingStop}
              onSave={handleEditStop}
              onClose={() => setEditingStop(null)}
              onMove={handleMoveStop}
            />
          )}
          {movingStop && (
            <StopForm
              initialData={movingStop}
              onCancel={() => setMovingStop(null)}
              onSubmit={handleMoveStopSubmit}
            />
          )}
          {stops && stops.map(stop => (
            <StopMarker
              key={stop.id}
              stop={stop}
              onClick={() => {
                setEditingStop(stop);
              }}
            />
          ))}
          {routeGeoJSON && (
            <GeoJSON data={routeGeoJSON} style={{ color: 'red', weight: 5, opacity: 0.9 }} />
          )}
          {selectedLinea && selectedLinea.rutaGeoJSON && (
            <GeoJSON
              data={JSON.parse(selectedLinea.rutaGeoJSON)}
              style={{ color: 'blue', weight: 5, opacity: 0.9 }}
            />
          )}
          {deleteStopMode && <DeleteStopControl />}
          <PolygonDrawControl
            featureGroupRef={featureGroupRef}
            polygonCoords={polygonCoords}
            setPolygonCoords={setPolygonCoords}
            handleCreated={handleCreated}
          />
        </MapContainer>
      </main>
      <Footer />
    </div>
  )
}
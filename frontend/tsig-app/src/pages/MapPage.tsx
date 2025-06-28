import { MapContainer, Marker, useMapEvents, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import React, { useState, useRef } from 'react'
import L from 'leaflet'
import RoutingControl from '../components/map/RoutingControl'
import { v4 as uuidv4 } from 'uuid'
import { createStop, getWMSFeatureInfo, deleteStop, CrearParadaDTO, updateStop } from '../services/api'
import { validateRoute, saveLine, LineaDTO, updateLine } from '../services/linea'
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
import { useMap } from 'react-leaflet'
import EditStopPopup from '../components/map/EditStopPopup'

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
  const [modifyingLineRoute, setModifyingLineRoute] = useState<LineaDTO | null>(null);
  const latestRouteGeoJSON = useRef<any>(null)
  const mapRef = useRef<any>(null)
  const [movingStop, setMovingStop] = useState<any | null>(null);
  const [newStopPosition, setNewStopPosition] = useState<[number, number] | null>(null);

  const handleCreateStop = async (stopData: CrearParadaDTO) => {
    try {
      await createStop(stopData)
      alert('Parada creada exitosamente')
      setCreatingStop(false)
      setNewStopPosition(null)
    } catch (error) {
      console.error('Error al crear parada:', error)
      // Mostrar mensaje de error pero no cerrar el componente
      if (error instanceof Error) {
        alert(`Error al crear la parada: ${error.message}`)
      } else {
        alert('Error al crear la parada. Por favor, inténtelo nuevamente.')
      }
      // No cerrar el componente para que el usuario pueda corregir los datos
    }
  }

  const handleCancelCreateStop = () => {
    setCreatingStop(false)
    setNewStopPosition(null)
  }

  const handleMapClickForStop = (latlng: [number, number]) => {
    setNewStopPosition(latlng)
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
    
    // Primero verificar que tenemos la ruta generada
    if (!latestRouteGeoJSON.current) {
      alert("Primero debe generar la ruta usando el botón de routing en el mapa.");
      return;
    }
        
    const payload = {
      routeGeoJSON: JSON.stringify(latestRouteGeoJSON.current)
    };
    
    try {
      console.time('validarRuta');
      const response = await validateRoute(payload);
      console.timeEnd('validarRuta');
      
      if (typeof response === 'string' && response.includes('OK')) {
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
      descripcion: formData.descripcion,
      empresa: formData.empresa,
      observacion: formData.observacion,
      estaHabilitada: true, // Por defecto habilitada
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
    try {
      await updateStop(stopData);
      alert('Parada actualizada exitosamente');
      setEditingStop(null);
    } catch (error) {
      console.error('Error al actualizar parada:', error);
      // Mostrar mensaje de error pero no cerrar el componente
      if (error instanceof Error) {
        alert(`Error al actualizar la parada: ${error.message}`);
      } else {
        alert('Error al actualizar la parada. Por favor, inténtelo nuevamente.');
      }
      // No cerrar el componente para que el usuario pueda corregir los datos
    }
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
      alert('Parada movida exitosamente');
      setMovingStop(null);
    } catch (error) {
      console.error('Error al mover parada:', error);
      // Mostrar mensaje de error pero no cerrar el componente
      if (error instanceof Error) {
        alert(`Error al mover la parada: ${error.message}`);
      } else {
        alert('Error al mover la parada. Por favor, inténtelo nuevamente.');
      }
      // No cerrar el componente para que el usuario pueda corregir los datos
    }
  };

  // Handler para iniciar la modificación del recorrido de una línea
  const handleModifyLineRoute = (linea: LineaDTO) => {
    setModifyingLineRoute(linea);
    
    // Si hay puntos en la línea, cargarlos
    if (linea.puntos && linea.puntos.length > 0) {
      const newPoints = linea.puntos.map((punto) => ({
        id: uuidv4(),
        lat: punto.latitud,
        lng: punto.longitud
      }));
      setPoints(newPoints);
      
      // Fit map to line bounds
      if (mapRef.current && newPoints.length > 0) {
        const latlngs = newPoints.map(p => [p.lat, p.lng] as [number, number]);
        const bounds = L.latLngBounds(latlngs);
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    }
    
    // Entrar en modo de edición de ruta
    setAddingRoute(true);
    setIsValidated(false);
  };

  // Cancelar modificación de recorrido
  const handleCancelModifyRoute = () => {
    setModifyingLineRoute(null);
    setAddingRoute(false);
    setPoints([]);
    setSelectedIdx(null);
    setIsValidated(false);
    setRouteGeoJSON(null);
    setShowRouteForm(false);
  };

  // Guardar modificación de recorrido  
  const handleSaveModifiedRoute = async (formData: { descripcion: string, empresa: string, observacion?: string }) => {
    if (!modifyingLineRoute) return;
    
    try {
      const routeData = {
        ...modifyingLineRoute,
        descripcion: formData.descripcion,
        empresa: formData.empresa,
        observacion: formData.observacion,
        puntos: points.map(pt => ({ latitud: pt.lat, longitud: pt.lng })),
        rutaGeoJSON: JSON.stringify(latestRouteGeoJSON.current)
      };
      
      await updateLine(routeData);
      alert('Recorrido de línea modificado correctamente');
      handleCancelModifyRoute();
    } catch (err: any) {
      alert('Error al modificar el recorrido: ' + (err?.response?.data || err.message));
    }
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

  function StopClickControl({ onMapClick }: { onMapClick: (latlng: [number, number]) => void }) {
    useMapEvents({
      click(e) {
        onMapClick([e.latlng.lat, e.latlng.lng])
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

  return (
    <div className="flex flex-col min-h-screen">
      <NavigationBar />
      <main className="flex-1">
        {/* Main Controls - Only show when not in any creation/modification mode */}
        {!creatingStop && !addingRoute && !modifyingLineRoute && (
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
          </div>
        )}

        {/* Stop Creation Flow */}
        {creatingStop && !newStopPosition && (
          <div className="flex justify-center my-4">
            <div className="bg-blue-100 border border-blue-300 px-4 py-2 rounded">
              <span className="text-blue-800">Haz clic en el mapa para crear una parada en esa ubicación</span>
            </div>
          </div>
        )}

        {creatingStop && (
          <div className="flex gap-2 justify-center my-4">
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded cursor-pointer"
              onClick={handleCancelCreateStop}
            >
              Cancelar Creación de Parada
            </button>
          </div>
        )}

        {/* Line Creation Flow */}
        {addingRoute && !showRouteForm && !modifyingLineRoute && (
          <div className="flex flex-col items-center gap-2 my-4">
            <div className="bg-green-100 border border-green-300 px-4 py-2 rounded">
              <span className="text-green-800">Creando nueva ruta. Haz clic en el mapa para agregar puntos.</span>
            </div>
            <div className="flex gap-2">
              {selectedIdx !== null && (
                <button
                  className="bg-red-400 text-white px-4 py-2 rounded"
                  onClick={handleDeleteSelected}
                >
                  Eliminar Punto Seleccionado
                </button>
              )}
              {points.length > 1 && !isValidated && (
                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded"
                  onClick={handleVerifyRoute}
                >
                  Verificar Ruta
                </button>
              )}
              {isValidated && (
                <>
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded"
                    onClick={() => setShowRouteForm(true)}
                  >
                    Guardar Ruta
                  </button>
                  <button
                    className="bg-gray-400 text-white px-4 py-2 rounded"
                    onClick={handleCancelValidation}
                  >
                    Cancelar Validación
                  </button>
                </>
              )}
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleCancelAddRoute}
              >
                Cancelar Creación
              </button>
            </div>
          </div>
        )}

        {/* Line Modification Flow */}
        {modifyingLineRoute && !showRouteForm && (
          <div className="flex flex-col items-center gap-2 my-4">
            <div className="bg-orange-100 border border-orange-300 px-4 py-2 rounded">
              <span className="text-orange-800">
                Modificando recorrido de "{modifyingLineRoute.descripcion}". Edita los puntos en el mapa.
              </span>
            </div>
            <div className="flex gap-2">
              {selectedIdx !== null && (
                <button
                  className="bg-red-400 text-white px-4 py-2 rounded"
                  onClick={handleDeleteSelected}
                >
                  Eliminar Punto Seleccionado
                </button>
              )}
              {points.length > 1 && !isValidated && (
                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded"
                  onClick={handleVerifyRoute}
                >
                  Verificar Ruta
                </button>
              )}
              {isValidated && (
                <>
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded"
                    onClick={() => setShowRouteForm(true)}
                  >
                    Guardar Modificación
                  </button>
                  <button
                    className="bg-gray-400 text-white px-4 py-2 rounded"
                    onClick={handleCancelValidation}
                  >
                    Cancelar Validación
                  </button>
                </>
              )}
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleCancelModifyRoute}
              >
                Cancelar Modificación
              </button>
            </div>
          </div>
        )}
        
        {addingRoute && isValidated && showRouteForm && !modifyingLineRoute && (
          <RouteForm
            points={points.map(pt => [pt.lat, pt.lng])}
            onCancel={() => {
              setShowRouteForm(false)
              setIsValidated(false)
              setRouteGeoJSON(null)
              setAddingRoute(false)
              setPoints([])
              setSelectedIdx(null)
            }}
            onSave={handleSaveRoute}
          />
        )}
        
        {addingRoute && isValidated && showRouteForm && modifyingLineRoute && (
          <RouteForm
            points={points.map(pt => [pt.lat, pt.lng])}
            onCancel={() => {
              setShowRouteForm(false)
              setIsValidated(false)
              setRouteGeoJSON(null)
              setModifyingLineRoute(null)
              setAddingRoute(false)
              setPoints([])
              setSelectedIdx(null)
            }}
            onSave={handleSaveModifiedRoute}
            initialData={{
              descripcion: modifyingLineRoute.descripcion,
              empresa: modifyingLineRoute.empresa,
              observacion: modifyingLineRoute.observacion
            }}
          />
        )}

        <MapContainer
          center={[-32.5, -56.0]}
          zoom={7}
          style={{ height: '80vh', width: '100%' }}
        >
          <SetMapRef mapRef={mapRef} />
          <LayerController 
            onMoveStop={handleMoveStop} 
            onModifyLineRoute={handleModifyLineRoute}
            onCenterMap={(latitud: number, longitud: number, zoom?: number) => {
              if (mapRef.current) {
                mapRef.current.setView([latitud, longitud], zoom || 16);
              }
            }}
          />
          {creatingStop && !modifyingLineRoute && (
            <>
              <StopClickControl onMapClick={handleMapClickForStop} />
              <StopForm
                onCancel={handleCancelCreateStop}
                onSubmit={handleCreateStop}
                initialData={newStopPosition ? {
                  nombre: 'Nueva Parada',
                  habilitada: true, // Por defecto habilitada
                  refugio: false,
                  observacion: '',
                  latitud: newStopPosition[0],
                  longitud: newStopPosition[1]
                } : undefined}
              />
            </>
          )}
          {(addingRoute || !!modifyingLineRoute) && !isValidated && <AddPointControl onAddPoint={handleAddPoint} />}
          {points.map((pt, idx) => (
            <Marker
              key={pt.id}
              position={[pt.lat, pt.lng]}
              draggable={(addingRoute || !!modifyingLineRoute) && !isValidated}
              eventHandlers={{
                dragend: (e) => (addingRoute || !!modifyingLineRoute) && !isValidated && handleMarkerDrag(idx, e),
                click: () => (addingRoute || !!modifyingLineRoute) && !isValidated && setSelectedIdx(idx)
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
          {(addingRoute || !!modifyingLineRoute) && points.length >= 2 && (
            <RoutingControl
              waypoints={points.map(pt => [pt.lat, pt.lng])}
              serviceUrl="https://router.project-osrm.org/route/v1"
              onRouteGeoJSON={geojson => {
                latestRouteGeoJSON.current = geojson;
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
          {deleteStopMode && <DeleteStopControl />}
        </MapContainer>
      </main>
      <Footer />
    </div>
  )
}
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

interface RoutingControlProps {
  waypoints: [number, number][];
  serviceUrl?: string;
}

export default function RoutingControl({ waypoints, serviceUrl }: RoutingControlProps) {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    if (!controlRef.current) {
      controlRef.current = L.Routing.control({
        waypoints: waypoints.map(([lat, lng]) => L.latLng(lat, lng)),
        router: L.Routing.osrmv1({
          serviceUrl: serviceUrl || 'https://router.project-osrm.org/route/v1'
        }),
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        showAlternatives: false,
        lineOptions: {
          styles: [{ color: 'red', weight: 7, opacity: 0.9 }],
          interactive: false
        },
        createMarker: () => null // <--- Prevents routing control from rendering its own markers
      }).addTo(map);
    }

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
    // Only run on mount/unmount
    // eslint-disable-next-line
  }, [map, serviceUrl]);

  // Update waypoints when they change
  useEffect(() => {
    if (controlRef.current) {
      controlRef.current.setWaypoints(waypoints.map(([lat, lng]) => L.latLng(lat, lng)));
    }
  }, [waypoints]);

  return null;
}
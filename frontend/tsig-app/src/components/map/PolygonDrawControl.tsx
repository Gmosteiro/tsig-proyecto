import React, { useEffect } from 'react'
import { FeatureGroup, Polygon } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'
import { useMap } from 'react-leaflet'

type PolygonDrawControlProps = {
    featureGroupRef: React.RefObject<any>
    polygonCoords: [number, number][]
    setPolygonCoords: React.Dispatch<React.SetStateAction<[number, number][]>>
    handleCreated: (e: any) => void
    autoEnable?: boolean
}

export default function PolygonDrawControl({
    featureGroupRef,
    polygonCoords,
    setPolygonCoords,
    handleCreated,
    autoEnable = false,
}: PolygonDrawControlProps) {
    const map = useMap()

    useEffect(() => {
        if (autoEnable && map) {
            // Simular click en el botón de polígono después de un pequeño delay
            setTimeout(() => {
                const polygonButton = document.querySelector(
                    '.leaflet-draw-draw-polygon'
                )
                if (polygonButton) {
                    ;(polygonButton as HTMLElement).click()
                }
            }, 100)
        }
    }, [autoEnable, map])

    return (
        <FeatureGroup ref={featureGroupRef}>
            {/* @ts-ignore */}
            <EditControl
                position="topright"
                onCreated={handleCreated}
                onDeleted={() => setPolygonCoords([])}
                draw={{
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                    polyline: false,
                    polygon: true,
                }}
            />
            {polygonCoords.length > 0 && (
                <Polygon positions={polygonCoords} />
            )}
        </FeatureGroup>
    )
}
import React from 'react'
import { FeatureGroup, Polygon } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'

type PolygonDrawControlProps = {
    featureGroupRef: React.RefObject<any>
    polygonCoords: [number, number][]
    setPolygonCoords: React.Dispatch<React.SetStateAction<[number, number][]>>
    handleCreated: (e: any) => void
}

export default function PolygonDrawControl({
    featureGroupRef,
    polygonCoords,
    setPolygonCoords,
    handleCreated,
}: PolygonDrawControlProps) {
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
import { useMapEvent } from 'react-leaflet'
import { useEffect } from 'react'
import { getWMSFeatureInfo } from '../../services/api'

interface WMSFeatureInfoHandlerProps {
    visible: boolean
    layerName: string
    tolerance?: number
    onFeatureInfo: (data: any) => void
}

export default function WMSFeatureInfoHandler({
    visible,
    layerName,
    tolerance = 8,
    onFeatureInfo,
}: WMSFeatureInfoHandlerProps) {
    useMapEvent('click', async (e) => {
        if (!visible) return

        const map = e.target
        const size = map.getSize()
        const bounds = map.getBounds()
        const crs = map.options.crs
        const point = map.latLngToContainerPoint(e.latlng, map.getZoom())

        const bbox = bounds.toBBoxString()
        const infoFormat = "application/json"

        try {
            const data = await getWMSFeatureInfo({
                layerName,
                crsCode: crs.code ?? "",
                bbox,
                size,
                point,
                infoFormat,
                tolerance
            })
            onFeatureInfo(data)
        } catch (err) {
            onFeatureInfo(null)
        }
    })

    useEffect(() => {
        if (!visible) onFeatureInfo(null)
    }, [visible, onFeatureInfo])

    return null
}
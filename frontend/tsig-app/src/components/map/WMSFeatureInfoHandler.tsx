import { useMapEvent } from 'react-leaflet'
import { useEffect, useRef } from 'react'
import { getWMSFeatureInfo } from '../../services/api'
import { WMS_MAX_FEATURES, WMS_TIMEOUT } from '../../lib/constants'

interface WMSFeatureInfoHandlerProps {
    visible: boolean
    layerName: string
    tolerance?: number
    styles?: string
    onFeatureInfo: (data: any) => void
}

export default function WMSFeatureInfoHandler({
    visible,
    layerName,
    tolerance = 8,
    styles,
    onFeatureInfo,
}: WMSFeatureInfoHandlerProps) {
    const abortControllerRef = useRef<AbortController | null>(null)

    useMapEvent('click', async (e) => {
        if (!visible) return

        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Crear nuevo AbortController para este request
        const abortController = new AbortController()
        abortControllerRef.current = abortController

        const map = e.target
        const size = map.getSize()
        const bounds = map.getBounds()
        const crs = map.options.crs

        const point = map.latLngToContainerPoint(e.latlng);

        const sw = crs.project(bounds.getSouthWest());
        const ne = crs.project(bounds.getNorthEast());
        const bbox = [sw.x, sw.y, ne.x, ne.y].join(',');

        const infoFormat = "application/json"

        try {
            // Agregar timeout al request
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), WMS_TIMEOUT)
            })

            const requestPromise = getWMSFeatureInfo({
                layerName,
                crsCode: crs.code ?? "",
                bbox,
                size,
                point,
                infoFormat,
                tolerance,
                styles,
                featureCount: WMS_MAX_FEATURES,
                abortSignal: abortController.signal
            })

            const data = await Promise.race([requestPromise, timeoutPromise])
            
            // Verificar si el request fue cancelado
            if (abortController.signal.aborted) {
                return
            }

            if (data && (data as any).features && (data as any).features.length > 0) {
                onFeatureInfo(data)
            } else {
                onFeatureInfo(null)
            }
        } catch (err: any) {
            // Solo reportar error si no fue cancelado
            if (!abortController.signal.aborted && err.name !== 'AbortError') {
                console.warn('Error en WMS GetFeatureInfo:', err.message)
                onFeatureInfo(null)
            }
        }
    })

    useEffect(() => {
        if (!visible) {
            // Cancelar request pendiente cuando la capa se oculta
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            onFeatureInfo(null)
        }
    }, [visible, onFeatureInfo])

    // Limpiar controller al desmontar
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    return null
}
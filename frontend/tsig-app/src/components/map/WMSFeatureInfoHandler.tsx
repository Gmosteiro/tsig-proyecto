import { useMapEvent } from 'react-leaflet'
import { useEffect, useRef } from 'react'
import { getWMSFeatureInfo } from '../../services/api'
import { WMS_MAX_FEATURES } from '../../lib/constants'

interface WMSFeatureInfoHandlerProps {
    visible: boolean
    layerName: string
    tolerance?: number
    styles?: string
    onFeatureInfo: (data: any) => void
    disabled?: boolean // Nueva prop para deshabilitar temporalmente
}

export default function WMSFeatureInfoHandler({
    visible,
    layerName,
    tolerance = 8,
    styles,
    onFeatureInfo,
}: WMSFeatureInfoHandlerProps) {
    const abortControllerRef = useRef<AbortController | null>(null)
    const clickTimeoutRef = useRef<number | null>(null)

    useMapEvent('click', async (e) => {
        if (!visible) return

        // Verificar si el click fue en un elemento de UI (botón, popup, etc.)
        const clickTarget = e.originalEvent?.target as Element
        if (clickTarget) {
            // Si el click fue en un botón, link, o elemento interactive, ignorarlo
            if (clickTarget.closest('button, a, .leaflet-control, [role="button"], [onclick]')) {
                return
            }
            
            // Si el click fue en un popup o modal, ignorarlo
            if (clickTarget.closest('[class*="popup"], [class*="modal"], [class*="selector"]')) {
                return
            }
        }

        // Limpiar timeout anterior si existe
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current)
        }

        // Agregar un pequeño delay para permitir que los eventos de UI se procesen primero
        clickTimeoutRef.current = setTimeout(async () => {
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
                // Agregar timeout específico para GetFeatureInfo (más corto que para tiles)
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Timeout GetFeatureInfo')), 8000) // 8 segundos para GetFeatureInfo
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
        }, 50) // 50ms de delay para permitir que los eventos de UI se procesen
    })

    useEffect(() => {
        if (!visible) {
            // Cancelar request pendiente cuando la capa se oculta
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            // Limpiar timeout pendiente
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current)
                clickTimeoutRef.current = null
            }
            onFeatureInfo(null)
        }
    }, [visible, onFeatureInfo])

    // Limpiar controller y timeout al desmontar
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current)
            }
        }
    }, [])

    return null
}
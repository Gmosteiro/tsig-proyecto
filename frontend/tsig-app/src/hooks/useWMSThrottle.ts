import { useRef, useCallback } from 'react'

/**
 * Hook para throttling de requests WMS para evitar error 429
 */
export const useWMSThrottle = (maxConcurrent: number = 3, delayBetweenRequests: number = 100) => {
    const pendingRequests = useRef<Set<string>>(new Set())
    const requestQueue = useRef<Array<() => void>>([])
    const processing = useRef(false)

    const processQueue = useCallback(async () => {
        if (processing.current || requestQueue.current.length === 0) {
            return
        }

        processing.current = true

        while (requestQueue.current.length > 0 && pendingRequests.current.size < maxConcurrent) {
            const nextRequest = requestQueue.current.shift()
            if (nextRequest) {
                nextRequest()
                // Pequeño delay entre requests para evitar sobrecarga
                if (delayBetweenRequests > 0) {
                    await new Promise(resolve => setTimeout(resolve, delayBetweenRequests))
                }
            }
        }

        processing.current = false

        // Procesar más requests si quedan en cola
        if (requestQueue.current.length > 0) {
            setTimeout(processQueue, delayBetweenRequests)
        }
    }, [maxConcurrent, delayBetweenRequests])

    const throttledRequest = useCallback(async <T>(
        requestId: string,
        requestFn: () => Promise<T>
    ): Promise<T> => {
        return new Promise((resolve, reject) => {
            const executeRequest = async () => {
                // Marcar request como pendiente
                pendingRequests.current.add(requestId)

                try {
                    const result = await requestFn()
                    resolve(result)
                } catch (error) {
                    reject(error)
                } finally {
                    // Remover de pendientes
                    pendingRequests.current.delete(requestId)
                    // Procesar siguiente en cola
                    processQueue()
                }
            }

            if (pendingRequests.current.size < maxConcurrent) {
                // Ejecutar inmediatamente si hay capacidad
                executeRequest()
            } else {
                // Agregar a cola
                requestQueue.current.push(executeRequest)
            }
        })
    }, [processQueue, maxConcurrent])

    const clearQueue = useCallback(() => {
        requestQueue.current = []
        pendingRequests.current.clear()
        processing.current = false
    }, [])

    return {
        throttledRequest,
        clearQueue,
        pendingCount: pendingRequests.current.size,
        queueLength: requestQueue.current.length
    }
}

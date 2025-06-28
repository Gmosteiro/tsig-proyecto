import { useState, useCallback } from 'react'
import axios from 'axios'

interface FiltroWMS {
    filtroLineas: string
    filtroParadas: string
    tieneResultados: boolean
    totalLineas: number
    totalParadas: number
}

interface CriteriosFiltro {
    empresa?: string
    idDepartamentoOrigen?: number
    idDepartamentoDestino?: number
    ruta?: number
    kilometro?: number
    poligonoGeoJSON?: string
    idsLineas?: number[]
    estaHabilitada?: boolean
    idParadaCercana?: number
}

export const useWMSFilters = () => {
    const [filtrosWMS, setFiltrosWMS] = useState<FiltroWMS | null>(null)
    const [loading, setLoading] = useState(false)

    /**
     * Aplica filtros WMS basados en criterios de búsqueda
     */
    const aplicarFiltrosWMS = useCallback(async (criterios: CriteriosFiltro) => {
        setLoading(true)
        try {
            const response = await axios.post('/apiurl/api/lineas/filtros-wms', criterios)
            const filtros = response.data as FiltroWMS
            setFiltrosWMS(filtros)
            return filtros
        } catch (error) {
            console.error('Error al aplicar filtros WMS:', error)
            // En caso de error, usar filtros que no muestren nada
            const filtrosError: FiltroWMS = {
                filtroLineas: '1=0',
                filtroParadas: '1=0',
                tieneResultados: false,
                totalLineas: 0,
                totalParadas: 0
            }
            setFiltrosWMS(filtrosError)
            return filtrosError
        } finally {
            setLoading(false)
        }
    }, [])

    /**
     * Limpia los filtros WMS (mostrar todo)
     */
    const limpiarFiltrosWMS = useCallback(async () => {
        setLoading(true)
        try {
            const response = await axios.post('/apiurl/api/lineas/limpiar-filtros-wms', {})
            const filtros = response.data as FiltroWMS
            setFiltrosWMS(filtros)
            return filtros
        } catch (error) {
            console.error('Error al limpiar filtros WMS:', error)
            // En caso de error, mostrar todo
            const filtrosLimpios: FiltroWMS = {
                filtroLineas: '1=1',
                filtroParadas: '1=1',
                tieneResultados: true,
                totalLineas: -1,
                totalParadas: -1
            }
            setFiltrosWMS(filtrosLimpios)
            return filtrosLimpios
        } finally {
            setLoading(false)
        }
    }, [])

    /**
     * Aplica filtros para resultados específicos de líneas (versión simplificada)
     */
    const aplicarFiltrosPorIdsLineas = useCallback(async (idsLineas: number[]) => {
        setLoading(true)
        try {
            const response = await axios.post('/apiurl/api/lineas/filtros-wms', idsLineas)
            const filtros = response.data as FiltroWMS
            setFiltrosWMS(filtros)
            return filtros
        } catch (error) {
            console.error('Error al aplicar filtros WMS por IDs:', error)
            // En caso de error, usar filtros que no muestren nada
            const filtrosError: FiltroWMS = {
                filtroLineas: '1=0',
                filtroParadas: '1=0',
                tieneResultados: false,
                totalLineas: 0,
                totalParadas: 0
            }
            setFiltrosWMS(filtrosError)
            return filtrosError
        } finally {
            setLoading(false)
        }
    }, [])

    /**
     * Limpia los filtros WMS simplemente (sin llamada al backend)
     */
    const limpiarFiltrosWMSLocal = useCallback(() => {
        setFiltrosWMS(null)
    }, [])

    /**
     * Aplica filtros por empresa
     */
    const aplicarFiltrosPorEmpresa = useCallback(async (empresa: string) => {
        return aplicarFiltrosWMS({ empresa })
    }, [aplicarFiltrosWMS])

    /**
     * Aplica filtros por origen y destino
     */
    const aplicarFiltrosPorOrigenDestino = useCallback(async (origen: number, destino: number) => {
        return aplicarFiltrosWMS({ 
            idDepartamentoOrigen: origen, 
            idDepartamentoDestino: destino 
        })
    }, [aplicarFiltrosWMS])

    /**
     * Aplica filtros por ruta y kilómetro
     */
    const aplicarFiltrosPorRutaKilometro = useCallback(async (ruta: number, kilometro: number) => {
        return aplicarFiltrosWMS({ ruta, kilometro })
    }, [aplicarFiltrosWMS])

    /**
     * Aplica filtros por polígono
     */
    const aplicarFiltrosPorPoligono = useCallback(async (poligonoGeoJSON: string) => {
        return aplicarFiltrosWMS({ poligonoGeoJSON })
    }, [aplicarFiltrosWMS])

    return {
        filtrosWMS,
        loading,
        aplicarFiltrosWMS,
        limpiarFiltrosWMS,
        limpiarFiltrosWMSLocal,
        aplicarFiltrosPorIdsLineas,
        aplicarFiltrosPorEmpresa,
        aplicarFiltrosPorOrigenDestino,
        aplicarFiltrosPorRutaKilometro,
        aplicarFiltrosPorPoligono
    }
}

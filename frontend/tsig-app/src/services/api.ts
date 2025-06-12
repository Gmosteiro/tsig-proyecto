import axios from 'axios'
// import { Stop } from '../lib/types/types'

export type ParadaDTO = {
    nombre: string
    estado: EstadoParada
    refugio: boolean
    observacion: string
    lat: number
    lon: number
}

export type RoutingPointDTO = {
    lat: number
    lon: number
}

export type RoutingRequestDTO = {
    points: RoutingPointDTO[]
}

export type EstadoParada = 'HABILITADA' | 'DESHABILITADA';

export async function createStop(stopData: ParadaDTO) {
    const res = await axios.post('/apiurl/api/parada/crear', stopData)
    console.log('result from createStop:', res)
    return res.data
}

export async function getRouteGeoJSON(request: RoutingRequestDTO) {
    const res = await axios.post('/apiurl/api/lineas/shortest-path', request)
    return res.data // 
}

export type CreateLineDTO = {
    id?: number
    nombre: string
    descripcion: string
    empresa: string
    observacion?: string
    puntos: PuntoDTO[]
}

export type PuntoDTO = {
    lat: number
    lon: number
}

// Update the function signature:
export const createLine = async (lineData: CreateLineDTO) => {
    const res = await axios.post('/apiurl/api/lineas', lineData)
    return res.data
}
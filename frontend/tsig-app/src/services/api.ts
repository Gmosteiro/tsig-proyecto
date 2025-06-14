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

export type PuntoDTO = {
    latitud: number
    longitud: number
}

export type LineaDTO = {
    id?: number
    nombre: string
    descripcion: string
    empresa: string
    observacion?: string
    puntos: PuntoDTO[]
    rutaGeoJSON: any
}

export async function validateRoute(request: RoutingRequestDTO) {
    const res = await axios.post('/apiurl/api/lineas/validar', request)
    return res.data
}

export const saveLine = async (lineData: LineaDTO) => {
    const res = await axios.post('/apiurl/api/lineas/guardar', lineData)
    return res.data
}

export async function createStop(stopData: ParadaDTO) {
    const res = await axios.post('/apiurl/api/parada/crear', stopData)
    console.log('result from createStop:', res)
    return res.data
}
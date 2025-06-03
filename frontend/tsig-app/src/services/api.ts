import axios from 'axios'
// import { Stop } from '../lib/types/types'

export type ParadaDTO = {
    nombre: string
    estado: EstadoParada
    refugio: boolean
    observacion: string
    latitud: number
    longitud: number
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
    const res = await axios.post('/apiurl/api/routing/shortest-path', request)
    return res.data // Should be GeoJSON
}
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

export type EstadoParada = 'HABILITADA' | 'DESHABILITADA';

export async function createStop(stopData: ParadaDTO) {
    // Use the proxy path and pass the object directly
    const res = await axios.post('/apiurl/api/parada/crear', stopData)
    console.log('result from createStop:', res)
    return res.data
}
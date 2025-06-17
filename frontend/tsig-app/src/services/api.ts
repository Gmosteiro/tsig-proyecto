import axios from 'axios'
// import { Stop } from '../lib/types/types'
import { WMS_URL } from '../lib/constants'
export type ParadaDTO = {
    id: number
    nombre: string
    estado: EstadoParada
    refugio: boolean
    observacion: string
    latitud: number
    longitud: number
}

export type CrearParadaDTO = Omit<ParadaDTO, 'id'>

export type RoutingPointDTO = {
    latitud: number
    longitud: number
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

export async function createStop(stopData: CrearParadaDTO) {
    const res = await axios.post('/apiurl/api/parada/crear', stopData)
    return res.data
}

export async function updateStop(stopData: ParadaDTO) {
    const res = await axios.put(`/apiurl/api/parada/actualizar/`, stopData);
    return res.data;
}

export type WMSFeatureInfoParams = {
    layerName: string,
    crsCode: string,
    bbox: string,
    size: { x: number, y: number },
    point: { x: number, y: number },
    infoFormat?: string,
    tolerance?: number
}

// Puedes ajustar este tipo según la estructura real de la respuesta del WMS
export type WMSFeatureInfoResponse = {
    type: string
    features: any[]
    [key: string]: any
}

export async function getWMSFeatureInfo({
    layerName,
    crsCode,
    bbox,
    size,
    point,
    infoFormat = "application/json",
    tolerance = 5
}: WMSFeatureInfoParams): Promise<WMSFeatureInfoResponse> {
    const url = new URL(WMS_URL);
    url.search = new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: '1.1.1',
        REQUEST: 'GetFeatureInfo',
        FORMAT: 'image/png',
        TRANSPARENT: 'true',
        QUERY_LAYERS: layerName,
        LAYERS: layerName,
        STYLES: '',
        SRS: crsCode,
        BBOX: bbox,
        WIDTH: size.x.toString(),
        HEIGHT: size.y.toString(),
        INFO_FORMAT: infoFormat,
        X: Math.round(point.x).toString(),
        Y: Math.round(point.y).toString(),
        FEATURE_COUNT: '5',
        BUFFER: tolerance.toString()
    } as Record<string, string>).toString();

    const resp = await axios.get(url.toString());
    return resp.data;
}
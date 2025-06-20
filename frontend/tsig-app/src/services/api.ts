import axios from 'axios'
// import { Stop } from '../lib/types/types'
import { WMS_URL } from '../lib/constants'
import { HorarioDTO } from './linea'
export type ParadaDTO = {
    id: number
    nombre: string
    estado: EstadoParada
    refugio: boolean
    observacion: string
    latitud: number
    longitud: number
}

export type ParadalineaDTO = {
    idParadaLinea: number
    idParada: number
    idLinea: number
    horarios: HorarioDTO[]
}

export type LineaDTO = {
    id: number;
    nombre: string;
    origen: string;
    destino: string;
    empresa: string;
    observacion: string;
};

export type CrearParadaDTO = Omit<ParadaDTO, 'id'>

export type RoutingPointDTO = {
    latitud: number
    longitud: number
}

export type RoutingRequestDTO = {
    points: RoutingPointDTO[]
}

export type EstadoParada = 'HABILITADA' | 'DESHABILITADA';

export async function createStop(stopData: CrearParadaDTO) {
    const res = await axios.post('/apiurl/api/parada/crear', stopData)
    return res.data
}

export async function updateStop(stopData: ParadaDTO) {
    console.log('Updating stop:', stopData)

    const res = await axios.put(`/apiurl/api/parada/modificar`, stopData);
    return res.data;
}

export async function deleteStop(id: number) {
    const res = await axios.delete(`/apiurl/api/parada/${id}`);
    return res.data;
}

export async function linkStopToLine(stopData: ParadalineaDTO) {
    const res = await axios.post('/apiurl/api/parada/asociar/linea', stopData)
    return res.data
}

export async function getAllLines(): Promise<LineaDTO[]> {
    const res = await axios.get('/apiurl/api/lineas/todas');
    return res.data;
}

export async function associateStopWithLine(data: ParadalineaDTO): Promise<any> {
    const res = await axios.post('/apiurl/api/parada/asociar/linea', data);
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
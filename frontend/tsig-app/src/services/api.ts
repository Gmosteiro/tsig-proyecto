import axios from 'axios'
// import { Stop } from '../lib/types/types'
import { WMS_URL } from '../lib/constants'

export type HorarioDTO = {
    id?: number
    hora: string // formato "HH:mm", solo hora y minutos
}

export type ParadaDTO = {
    id: number
    nombre: string
    habilitada: boolean // true = habilitada, false = deshabilitada
    refugio: boolean
    observacion: string
    latitud: number
    longitud: number
}

export type ParadaLineaDTO = {
    idParadaLinea: number
    idParada: number
    idLinea: number
    estaHabilitada: boolean
    horarios: HorarioDTO[]
    nombreParada?: string
    latitudParada?: number
    longitudParada?: number
}

export type LineaDTO = {
    id: number;
    descripcion: string;
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

export async function createStop(stopData: CrearParadaDTO) {
    try {
        const res = await axios.post('/apiurl/api/parada/crear', stopData)
        return res.data
    } catch (error: any) {
        // Si el error tiene una respuesta del servidor, extraer el mensaje
        if (error.response && error.response.data) {
            throw new Error(error.response.data)
        }
        throw error
    }
}

export async function updateStop(stopData: ParadaDTO) {
    console.log('Updating stop:', stopData)
    try {
        const res = await axios.put(`/apiurl/api/parada/modificar`, stopData);
        return res.data;
    } catch (error: any) {
        // Si el error tiene una respuesta del servidor, extraer el mensaje
        if (error.response && error.response.data) {
            throw new Error(error.response.data)
        }
        throw error
    }
}

export async function deleteStop(id: number) {
    const res = await axios.delete(`/apiurl/api/parada/${id}`);
    return res.data;
}

export async function getAllLines(): Promise<LineaDTO[]> {
    const res = await axios.get('/apiurl/api/lineas/todas');
    return res.data;
}

export async function associateStopWithLine(data: ParadaLineaDTO): Promise<any> {
    const res = await axios.post('/apiurl/api/parada/linea/asociar', data);
    return res.data;
}

export async function getAssociatedLinesForStop(paradaId: number): Promise<ParadaLineaDTO[]> {
    const res = await axios.get('/apiurl/api/parada/linea/todas');
    return res.data.filter((pl: ParadaLineaDTO) => Number(pl.idParada) === Number(paradaId));
}

export async function removeStopLineAssociation(idParadaLinea: number): Promise<any> {
    const res = await axios.delete(`/apiurl/api/parada/linea/${idParadaLinea}`);
    return res.data;
}

export async function removeSchedule(idHorario: number): Promise<any> {
    const res = await axios.delete(`/apiurl/api/parada/linea/horario/${idHorario}`);
    return res.data;
}

export async function toggleAssociationStatus(idParadaLinea: number): Promise<any> {
    const res = await axios.put(`/apiurl/api/parada/linea/${idParadaLinea}/toggle-estado`);
    return res.data;
}

export async function getSchedulesForLineAndStop(lineaId: number, paradaId: number): Promise<HorarioDTO[]> {
    const res = await axios.get(`/apiurl/api/horarios?lineaId=${lineaId}&paradaId=${paradaId}`);
    return res.data;
}

export async function getEmpresas(): Promise<{ id: number, nombre: string }[]> {
    const res = await axios.get('/apiurl/api/empresa');
    console.log('Empresas:', res.data);
    return res.data;
}

export async function addScheduleToLineStop(
    lineaId: number,
    paradaId: number,
    horario: HorarioDTO,
    idParadaLinea: number
): Promise<any> {
    const paradaLineaDTO = {
        idParadaLinea: Number(idParadaLinea),
        idParada: Number(paradaId),
        idLinea: Number(lineaId),
        horarios: [horario]
    };
    const res = await axios.post('/apiurl/api/parada/linea/horario', paradaLineaDTO);
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
    featureCount?: number
    styles?: string
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
    tolerance = 5,
    featureCount = 5,
    styles = ''
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
        STYLES: styles,
        SRS: crsCode,
        BBOX: bbox,
        WIDTH: size.x.toString(),
        HEIGHT: size.y.toString(),
        INFO_FORMAT: infoFormat,
        X: Math.round(point.x).toString(),
        Y: Math.round(point.y).toString(),
        FEATURE_COUNT: featureCount.toString(),
        BUFFER: tolerance.toString()
    } as Record<string, string>).toString();

    const resp = await axios.get(url.toString());
    return resp.data;
}

/**
 * Obtiene las líneas que están cerca de una parada específica
 * @param paradaId ID de la parada
 * @param distanciaMetros Distancia máxima en metros (por defecto 100)
 * @returns Lista de líneas cercanas
 */
export async function getLineasCercanasAParada(paradaId: number, distanciaMetros: number = 100): Promise<LineaDTO[]> {
    const res = await axios.get(`/apiurl/api/lineas/cercanas-a-parada`, {
        params: { paradaId, distanciaMetros }
    });
    return res.data;
}

export async function changeStopLineAssociationStatus(paradaLineaId: number, enabled: boolean): Promise<void> {
    const response = await axios.put(`/apiurl/api/parada/linea/${paradaLineaId}/estado`, null, {
        params: { habilitada: enabled }
    });
    return response.data;
}
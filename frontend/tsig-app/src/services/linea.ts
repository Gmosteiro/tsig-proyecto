import axios from 'axios';

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
    origen?: string
    destino?: string
    puntos: PuntoDTO[]
    rutaGeoJSON: string

}

export type HorarioDTO = {
    hora: string // formato "HH:mm", solo hora y minutos
}

export type RoutingPointDTO = {
    latitud: number
    longitud: number
}

export type RoutingRequestDTO = {
    points: RoutingPointDTO[]
}

export const saveLine = async (lineData: LineaDTO) => {
    const res = await axios.post('/apiurl/api/lineas/guardar', lineData)
    return res.data
}

export async function validateRoute(request: RoutingRequestDTO) {
    const res = await axios.post('/apiurl/api/lineas/validar', request)
    return res.data
}

type OrigenDestinoDto = {
    idDepartamentoOrigen: number;
    idDepartamentoDestino: number;
}

export const getLineaOrigenDestino = async (data: OrigenDestinoDto): Promise<LineaDTO[]> => {
    try {
        const res = await axios.post('/apiurl/api/lineas/origendestino', data);
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return [];
        }
        throw error;
    }
}

export const getDepartamentos = async () => {
    // Simulated response
    return [
        { id: 1, nombre: "ARTIGAS" },
        { id: 2, nombre: "SALTO" },
        { id: 3, nombre: "RIVERA" },
        { id: 4, nombre: "LÍMITE CONTESTADO" },
        { id: 5, nombre: "TACUAREMBÓ" },
        { id: 6, nombre: "PAYSANDÚ" },
        { id: 7, nombre: "CERRO LARGO" },
        { id: 8, nombre: "RÍO NEGRO" },
        { id: 9, nombre: "DURAZNO" },
        { id: 10, nombre: "TREINTA Y TRES" },
        { id: 11, nombre: "SORIANO" },
        { id: 12, nombre: "FLORIDA" },
        { id: 13, nombre: "FLORES" },
        { id: 14, nombre: "ROCHA" },
        { id: 15, nombre: "LAVALLEJA" },
        { id: 16, nombre: "COLONIA" },
        { id: 17, nombre: "SAN JOSÉ" },
        { id: 18, nombre: "MALDONADO" },
        { id: 19, nombre: "CANELONES" },
        { id: 20, nombre: "MONTEVIDEO" }
    ].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

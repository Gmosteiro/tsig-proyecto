import axios from 'axios';
import { ParadaLineaDTO } from './api';

export type PuntoDTO = {
    latitud: number
    longitud: number
}
export type LineaDTO = {
    id?: number
    descripcion: string
    empresa: string
    observacion?: string
    origen?: string
    destino?: string
    estaHabilitada: boolean
    puntos: PuntoDTO[]
    rutaGeoJSON: string
}

export type RoutingPointDTO = {
    latitud: number
    longitud: number
}

export type RoutingRequestDTO = {
    points: RoutingPointDTO[]
}

export type ValidateRouteRequestDTO = {
    routeGeoJSON: string // GeoJSON LineString de la ruta generada
}

export const saveLine = async (lineData: LineaDTO) => {
    const res = await axios.post('/apiurl/api/lineas/guardar', lineData)
    return res.data
}

// Función para actualizar una línea existente
export async function updateLine(lineData: LineaDTO) {
    const res = await axios.put('/apiurl/api/lineas', lineData)
    return res.data
}

// Función para eliminar una línea
export async function deleteLine(id: number) {
    const res = await axios.delete(`/apiurl/api/lineas/${id}`)
    return res.data
}

// Función para obtener una línea por ID
export async function getLineById(id: number): Promise<LineaDTO> {
    const res = await axios.get('/apiurl/api/lineas', { params: { id } })
    return res.data
}

export async function validateRoute(request: ValidateRouteRequestDTO) {
    const res = await axios.post('/apiurl/api/lineas/validar', request)
    return res.data
}

type HorariosDTO = {
    horaDesde: string; // formato "HH:mm:ss"
    horaHasta: string; // formato "HH:mm:ss"
}

export async function getLinesByGeoJson(geoJson: string): Promise<LineaDTO[]> {
    try {
        const res = await axios.post('/apiurl/api/lineas/interseccion-poligono', geoJson);
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return [];
        }
        throw error;
    }
}

export const getLineasPorKilometro = async (kilometro: number, ruta: number): Promise<LineaDTO[]> => {
    try {
        const res = await axios.post('/apiurl/api/lineas/rutakm', { ruta: ruta, kilometro: kilometro });
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return [];
        }
        throw error;
    }
}

export async function getLineasByHorario(horarios: HorariosDTO): Promise<LineaDTO[]> {
    try {

        // hh:mm:ss
        const res = await axios.get('/apiurl/api/lineas/reporte-horario', {
            params: horarios
        });
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return [];
        }
        throw error;
    }
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

export const getLineaByNombreEmpresa = async (nombre: string): Promise<LineaDTO[]> => {
    try {
        const res = await axios.get('/apiurl/api/lineas/empresa', {
            params: { empresa: nombre }
        });

        return res.data;
    }
    catch (error: any) {
        if (error.response && error.response.status === 404) {
            return [];
        }
        throw error;
    }
}


export const updateGeoJSON = async (linea: LineaDTO): Promise<LineaDTO> => {
    try {
        const res = await axios.get('/apiurl/api/lineas', {
            params: { id: linea.id }
        });
        return res.data;

    }
    catch (error: any) {
        if (error.response && error.response.status === 404) {
            return linea; // Si no se encuentra, devolvemos la línea original
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

// Función para obtener líneas cercanas a una parada específica
export async function getLineasCercanasAParada(paradaId: number, distanciaMetros: number = 100): Promise<LineaDTO[]> {
    try {
        const res = await axios.get('/apiurl/api/lineas/cercanas-a-parada', {
            params: { 
                paradaId, 
                distanciaMetros 
            }
        });
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return [];
        }
        throw error;
    }
}

// Función para obtener todas las líneas habilitadas
export async function getAllLineas(): Promise<LineaDTO[]> {
    try {
        const res = await axios.get('/apiurl/api/lineas/todas');
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return [];
        }
        throw error;
    }
}

// Función para obtener paradas asociadas a una línea con sus horarios
export async function getParadasDeLinea(lineaId: number): Promise<ParadaLineaDTO[]> {
    try {
        const res = await axios.get(`/apiurl/api/lineas/${lineaId}/paradas`);
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return [];
        }
        throw error;
    }
}

// Función para cambiar estado de línea
export async function changeLineStatus(lineaId: number, enabled: boolean): Promise<void> {
    const response = await axios.put(`/apiurl/api/lineas/${lineaId}/estado`, null, {
        params: { habilitada: enabled }
    });
    return response.data;
}

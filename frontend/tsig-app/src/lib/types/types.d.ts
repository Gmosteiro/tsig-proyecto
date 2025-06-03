export type LoginData = {
    user: string;
    password: string;
};

export interface User {
    name: string;
}
export interface Stop {
    id: string
    name: string
    location: {
        type: 'Point'
        coordinates: [number, number] // [lng, lat]
    }
    route: string
    department: string
    direction: 'ida' | 'vuelta'
    status: 'enabled' | 'disabled'
    shelter: boolean
    observations?: string
}

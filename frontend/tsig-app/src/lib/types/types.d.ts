export type LoginData = {
    email: string;
    password: string;
};

export type RegisterData = {
    email: string;
    password: string;
    name: string;
};


export interface User {
    email: string;
    name: string;
    verified: boolean;
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

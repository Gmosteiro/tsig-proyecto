// src/services/auth/authService.ts
import { LoginData, RegisterData, User } from "../../lib/types/types";

interface SessionResponse {
    token: string;
    user: User;
}

const API_URL = "http://localhost:8081";

export const registerUser = async (formData: RegisterData) => {
    await new Promise((res) => setTimeout(res, 500));
    if (formData.email === "fail@example.com") {
        throw new Error("Mock: Email already registered");
    }
    return {
        token: "mocked-jwt-token",
        user: { email: formData.email, name: formData.name },
    };
};

export const loginUser = async (credentials: LoginData): Promise<SessionResponse> => {
    const res = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Login failed");
    }

    // Como el backend solo devuelve texto, simulamos la respuesta
    return {
        token: "mocked-token-del-backend",
        user: {
            email: credentials.email,
            name: "Usuario",
            verified: true,
        },
    };
};




export const loginWithGoogle = async (): Promise<SessionResponse> => {
    await new Promise((res) => setTimeout(res, 500));
    return {
        token: "mocked-google-token",
        user: {
            email: "googleuser@example.com",
            name: "Google User",
            verified: true
        },
    };
};

export const verifyUser = async (data: {
    nombreCompleto: string;
    numeroDocumento: string;
    fechaNacimiento: string;
}) => {
    await new Promise((res) => setTimeout(res, 500));
    const birthDate = new Date(data.fechaNacimiento);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    const is18OrOlder = age > 18 || (age === 18 && m >= 0 && today.getDate() >= birthDate.getDate());

    return {
        status: 200,
        verified: is18OrOlder ? true : false,
        message: is18OrOlder ? "User verified successfully" : "User is under 18 years old",
    };
};
// src/services/auth/authService.ts
import { LoginData, RegisterData, User } from "../../lib/types/types";

interface SessionResponse {
    token: string;
    user: User;
}

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
    await new Promise((res) => setTimeout(res, 500));
    if (credentials.email !== "test@test.com" || credentials.password !== "Test.1234") {
        throw new Error("Mock: Invalid credentials");
    }

    return {
        token: "mocked-jwt-token",
        user: {
            email: credentials.email,
            name: "Test User",
            verified: false
        }
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
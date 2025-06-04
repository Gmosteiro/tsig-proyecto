// src/services/auth/authService.ts
import { LoginData, User } from "../../lib/types/types";

interface SessionResponse {
    token: string;
    user: User;
}

export const loginUser = async (credentials: LoginData): Promise<SessionResponse> => {
    const response = await fetch(
        `/apiurl/api/auth/login/${credentials.user}/${credentials.password}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
    const text = await response.text();

    if (!response.ok) {
        throw new Error(text || "Login failed");
    }

    return {
        token: "mocked-token-del-backend",
        user: {
            name: "Admin",
        }
    };
};

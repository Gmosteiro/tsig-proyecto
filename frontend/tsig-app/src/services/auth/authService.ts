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

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Login failed");
    }

    const data = await response.json();
    
    return {
        token: data.token,
        user: {
            name: data.user.name,
            verified: data.user.verified
        }
    };
};

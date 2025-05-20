// src/pages/LoginPage.tsx
import { useState } from "react";
import { loginUser } from "../services/auth/authService";
import { useAuth } from "../context/authContext";

interface LoginFormData {
    email: string;
    password: string;
}

export default function LoginPage() {
    const [form, setForm] = useState<LoginFormData>({
        email: "",
        password: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const { login } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        try {
            const response = await loginUser({
                email: form.email,
                password: form.password,
            });

            login(response.token, response.user);

            setSuccess(true);
            setForm({
                email: "",
                password: "",
            });
        } catch (err: any) {
            setError(err?.message || "Login failed");
        }
    };

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-[#f5f6fa]">
            <div className="max-w-md w-full p-8 border border-gray-200 rounded-2xl bg-white shadow-lg">
                <h2 className="text-center mb-7 text-2xl font-semibold text-gray-900">Iniciar sesión</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label className="font-medium text-gray-700 block">
                            Email
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md text-base outline-none box-border mb-1 focus:ring-2 focus:ring-blue-200"
                            />
                        </label>
                    </div>
                    <div className="mb-5">
                        <label className="font-medium text-gray-700 block">
                            Contraseña
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md text-base outline-none box-border mb-1 focus:ring-2 focus:ring-blue-200"
                            />
                        </label>
                    </div>
                    {error && (
                        <div className="text-red-600 mb-4 text-center font-medium">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="text-green-700 mb-4 text-center font-medium">
                            ¡Inicio de sesión exitoso!
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-700 text-white rounded-md font-bold text-base cursor-pointer mb-3 transition-colors duration-200 hover:bg-blue-800"
                    >
                        Iniciar sesión
                    </button>
                </form>
            </div>
        </div>
    );
}

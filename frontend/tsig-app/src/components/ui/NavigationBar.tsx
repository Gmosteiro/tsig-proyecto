import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const NavigationBar: React.FC = () => {
    const navigate = useNavigate();
    const { logout, isAuthenticated } = useAuth();



    return (
        <nav className="flex items-center justify-between px-8 py-4 bg-blue-700 text-white shadow-md">
            {isAuthenticated ? (
                <button
                    onClick={() => {
                        logout();
                        navigate('/map');
                    }}
                    className="bg-white text-blue-700 border-none rounded px-4 py-2 cursor-pointer font-bold shadow hover:bg-blue-50 transition-colors duration-200"
                >
                    Logout
                </button>
            ) : (
                <button
                    onClick={() => {
                        navigate('/login');
                    }}
                    className="bg-white text-blue-700 border-none rounded px-4 py-2 cursor-pointer font-bold shadow hover:bg-blue-50 transition-colors duration-200"
                >
                    Login
                </button>
            )}
        </nav>
    );
};

export default NavigationBar;
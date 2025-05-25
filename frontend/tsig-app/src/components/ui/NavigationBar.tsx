import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
// import logo from '../../assets/logo.svg';

const NavigationBar: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/map');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleAdminDashboard = () => {
        navigate('/admin');
    };

    return (
        <nav className="flex items-center justify-between px-8 py-4 bg-blue-700 text-white shadow-md">
            <div className="flex items-center gap-8">
                {/* <img
                    src={logo}
                    alt="Tsig-App Logo"
                    className="h-10 w-auto cursor-pointer"
                    onClick={() => navigate('/')}
                /> */}
                {user && (
                    <button
                        onClick={handleAdminDashboard}
                        className="bg-blue-900 text-white border-none rounded px-4 py-2 cursor-pointer font-bold shadow hover:bg-blue-800 transition-colors duration-200"
                    >
                        Admin Dashboard
                    </button>
                )}
            </div>
            {user ? (
                <button
                    onClick={handleLogout}
                    className="bg-white text-blue-700 border-none rounded px-4 py-2 cursor-pointer font-bold shadow hover:bg-blue-50 transition-colors duration-200"
                >
                    Logout
                </button>
            ) : (
                <button
                    onClick={handleLogin}
                    className="bg-white text-blue-700 border-none rounded px-4 py-2 cursor-pointer font-bold shadow hover:bg-blue-50 transition-colors duration-200"
                >
                    Login Anacletico
                </button>
            )}
        </nav>
    );
};

export default NavigationBar;
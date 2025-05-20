import React from 'react';

const Footer: React.FC = () => (
    <footer className="w-full bg-blue-700 text-white py-4 px-8 shadow-inner mt-auto">
        <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto">
            <span className="text-sm">&copy; {new Date().getFullYear()} Tsig-App. Todos los derechos reservados.</span>
            <div className="flex gap-4 mt-2 md:mt-0">
                <a
                    href="https://github.com/Tsig-App"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-white text-sm"
                >
                    GitHub
                </a>
                <a
                    href="mailto:soporte@Tsig-App.com"
                    className="hover:underline text-white text-sm"
                >
                    Contacto
                </a>
            </div>
        </div>
    </footer>
);

export default Footer;
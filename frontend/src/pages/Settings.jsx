
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Settings as SettingsIcon, Store, Link as LinkIcon, Copy } from 'lucide-react';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('guide'); // Default to guide per user request ("mini tutorial")

    const copyLink = (link) => {
        navigator.clipboard.writeText(link);
        alert('Enlace copiado al portapapeles');
    };

    const businessLink = `https://turnopro.com/p/${user?.subdomain || 'tu-negocio'}`; // Hypothetical

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Configuración y Ayuda</h1>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('guide')}
                    className={`pb-3 px-4 flex items-center gap-2 font-medium transition-colors border-b-2 ${activeTab === 'guide'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <BookOpen size={18} />
                    Guía de Inicio
                </button>
                <button
                    onClick={() => setActiveTab('general')}
                    className={`pb-3 px-4 flex items-center gap-2 font-medium transition-colors border-b-2 ${activeTab === 'general'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <SettingsIcon size={18} />
                    Configuración General
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

                {/* GUIDE TAB */}
                {activeTab === 'guide' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="prose max-w-none text-gray-600">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Bienvenido a TurnoPro</h2>
                            <p className="mb-6">
                                Sigue estos pasos para poner en marcha tu negocio rápidamente.
                            </p>

                            {/* Step 1: Services */}
                            <div className="flex gap-4 mb-8">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">1</div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-lg">Crea tus Servicios</h3>
                                    <p className="mb-2">Lo primero es definir qué ofreces a tus clientes.</p>
                                    <ul className="list-disc list-inside space-y-1 mb-3">
                                        <li>Ve a la pestaña <strong>Servicios</strong> en el menú lateral.</li>
                                        <li>Haz clic en "Nuevo Servicio".</li>
                                        <li>Define nombre, duración (minutos) y precio.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Step 2: Employees */}
                            <div className="flex gap-4 mb-8">
                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">2</div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-lg">Registra a tus Empleados</h3>
                                    <p className="mb-2">¿Quiénes realizarán los servicios?</p>
                                    <ul className="list-disc list-inside space-y-1 mb-3">
                                        <li>Ve a la pestaña <strong>Empleados</strong>.</li>
                                        <li>Crea un perfil para cada profesional.</li>
                                        <li>Asígnales los servicios que pueden realizar.</li>
                                        <li>Edita su horario de disponibilidad.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Step 3: Link */}
                            <div className="flex gap-4 mb-8">
                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold shrink-0">3</div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-lg">¡Comparte tu Enlace!</h3>
                                    <p className="mb-2">Tus clientes ya pueden reservar turnos online.</p>
                                    <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between border border-gray-200 mt-2">
                                        <div className="flex items-center gap-2 text-blue-600 font-medium truncate">
                                            <Store size={18} />
                                            <span>TU PÁGINA DE RESERVAS</span>
                                        </div>
                                        <button
                                            onClick={() => copyLink(window.location.origin + '/p/' + (user?.business_id || 'tu-negocio'))}
                                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                                        >
                                            <Copy size={16} />
                                            Copiar Enlace
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2">
                                        * Este enlace es el que debes poner en tu Instagram o WhatsApp.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'general' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="max-w-xl">
                            <h3 className="text-lg font-semibold mb-4">Información del Negocio</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Negocio</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                        value="Patagonia Automatiza (Demo)"
                                        disabled
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Contacta a soporte para cambiar esto.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email del Propietario</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                        value={user?.email || ''}
                                        disabled
                                    />
                                </div>

                                <div className="pt-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Preferencias</h4>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="notif" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" defaultChecked />
                                        <label htmlFor="notif" className="text-sm text-gray-700">Recibir notificaciones por email al tener nuevas reservas</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Settings;

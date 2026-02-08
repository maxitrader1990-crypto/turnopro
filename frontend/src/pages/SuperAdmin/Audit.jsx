import React from 'react';
import { FileText, Construction } from 'lucide-react';

const SuperAdminAudit = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <FileText className="text-purple-500" size={32} />
                Audit Logs
            </h2>

            <div className="bg-[#111] p-12 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                    <Construction size={48} className="text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Próximamente</h3>
                <p className="text-gray-400 max-w-md">
                    El registro de auditoría y actividad del sistema estará disponible en la próxima actualización.
                </p>
            </div>
        </div>
    );
};

export default SuperAdminAudit;

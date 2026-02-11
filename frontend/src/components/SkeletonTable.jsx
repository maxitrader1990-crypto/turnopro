
import React from 'react';

const SkeletonTable = ({ rows = 5 }) => {
    return (
        <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden animate-pulse">
            <div className="h-12 bg-white/10 border-b border-white/5 w-full mb-4"></div>
            <div className="p-6 space-y-4">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-700/50"></div>
                        <div className="flex-1 h-4 bg-gray-700/50 rounded"></div>
                        <div className="hidden sm:block w-1/4 h-4 bg-gray-700/30 rounded"></div>
                        <div className="w-20 h-8 bg-gray-700/30 rounded"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkeletonTable;

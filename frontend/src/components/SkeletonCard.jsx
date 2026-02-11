
import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-700/50"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700/30 rounded w-1/2"></div>
                </div>
            </div>
            <div className="space-y-3">
                <div className="h-3 bg-gray-700/30 rounded w-full"></div>
                <div className="h-3 bg-gray-700/30 rounded w-5/6"></div>
            </div>
        </div>
    );
};

export default SkeletonCard;

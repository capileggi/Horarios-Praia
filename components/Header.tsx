
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
            <i className="fa-solid fa-utensils text-2xl text-indigo-600"></i>
            <h1 className="text-2xl font-bold text-slate-800">
                Planificador de Personal de Restaurante
            </h1>
        </div>
      </div>
    </header>
  );
};


import React, { useState, useMemo } from 'react';
import { Employee, ScheduleData, DayOfWeek, ShiftType, Role } from '../types';

interface EditEmployeeScheduleModalProps {
    employee: Employee;
    schedule: ScheduleData;
    onClose: () => void;
    onSave: (employeeId: number, assignments: { [key in DayOfWeek]: { lunch: boolean, dinner: boolean } }) => void;
}

const generateInitialAssignments = (employee: Employee, schedule: ScheduleData): { [key in DayOfWeek]: { lunch: boolean, dinner: boolean } } => {
    const initial: any = {};
    for (const day of Object.values(DayOfWeek)) {
        const daySchedule = schedule[day];
        const isLunch = !!(daySchedule.almuerzo.employees[employee.role] as number[] | undefined)?.includes(employee.id);
        const isDinner = !!(daySchedule.cena.employees[employee.role] as number[] | undefined)?.includes(employee.id);
        initial[day] = { lunch: isLunch, dinner: isDinner };
    }
    return initial;
}

const EditEmployeeScheduleModal: React.FC<EditEmployeeScheduleModalProps> = ({ employee, schedule, onClose, onSave }) => {
    const initialAssignments = useMemo(() => generateInitialAssignments(employee, schedule), [employee, schedule]);
    const [assignments, setAssignments] = useState(initialAssignments);

    const handleCheckboxChange = (day: DayOfWeek, shift: 'lunch' | 'dinner') => {
        setAssignments(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [shift]: !prev[day][shift]
            }
        }));
    };
    
    const handleSave = () => {
        onSave(employee.id, assignments);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl transform transition-all animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Editar Horario para <span className="text-indigo-600">{employee.name}</span></h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <i className="fa-solid fa-xmark fa-lg"></i>
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm text-center">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="p-2 text-left font-semibold text-slate-600">Turno</th>
                                {Object.values(DayOfWeek).map(day => (
                                    <th key={day} className="p-2 font-semibold text-slate-600 capitalize">{day.substring(0,3)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-200">
                                <td className="p-2 text-left font-semibold text-slate-700">
                                    <i className="fa-regular fa-sun text-yellow-500 mr-2"></i>Almuerzo
                                </td>
                                {Object.values(DayOfWeek).map(day => (
                                    <td key={`${day}-lunch`} className="p-2">
                                        <input 
                                            type="checkbox" 
                                            className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            checked={assignments[day].lunch}
                                            onChange={() => handleCheckboxChange(day, 'lunch')}
                                            aria-label={`Asignar almuerzo para ${day}`}
                                        />
                                    </td>
                                ))}
                            </tr>
                             <tr>
                                <td className="p-2 text-left font-semibold text-slate-700">
                                    <i className="fa-regular fa-moon text-indigo-500 mr-2"></i>Cena
                                </td>
                                {Object.values(DayOfWeek).map(day => (
                                    <td key={`${day}-dinner`} className="p-2">
                                        <input 
                                            type="checkbox" 
                                            className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            checked={assignments[day].dinner}
                                            onChange={() => handleCheckboxChange(day, 'dinner')}
                                            aria-label={`Asignar cena para ${day}`}
                                        />
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                        Guardar Cambios
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default EditEmployeeScheduleModal;

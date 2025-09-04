
import React from 'react';
import { Employee, EmployeeHours, DayOfWeek } from '../types';
import { RoleIcon } from './RoleIcon';

interface HoursSummaryViewProps {
    employees: Employee[];
    employeeHours: { [employeeId: number]: EmployeeHours };
}

export const HoursSummaryView: React.FC<HoursSummaryViewProps> = ({ employees, employeeHours }) => {
    const days = Object.values(DayOfWeek);
    
    return (
        <div className="overflow-x-auto bg-slate-50 p-4 rounded-lg border border-slate-200 w-full">
            <table className="min-w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b-2 border-slate-300">
                        <th className="p-3 text-left font-semibold text-slate-600">Empleado</th>
                        {days.map(day => (
                            <th key={day} className="p-3 text-center font-semibold text-slate-600 capitalize">{day}</th>
                        ))}
                        <th className="p-3 text-center font-semibold text-slate-600 bg-slate-100 rounded-tr-lg">Total Semanal</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map(employee => {
                        const hours = employeeHours[employee.id];
                        return (
                            <tr key={employee.id} className="border-b border-slate-200 hover:bg-slate-100/75">
                                <td className="p-3">
                                    <div className="flex items-center">
                                        <RoleIcon role={employee.role} />
                                        <div>
                                            <p className="font-semibold text-slate-800">{employee.name}</p>
                                            <p className="text-xs text-slate-500">{employee.role}</p>
                                        </div>
                                    </div>
                                </td>
                                {days.map(day => (
                                    <td key={`${employee.id}-${day}`} className="p-3 text-center text-slate-700">
                                        {(hours?.daily[day] ?? 0).toFixed(1)}h
                                    </td>
                                ))}
                                <td className="p-3 text-center font-bold text-indigo-700 bg-slate-100">
                                    {(hours?.weekly ?? 0).toFixed(1)}h
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

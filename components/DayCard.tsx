import React, { useState } from 'react';
import { DailySchedule, Employee, Role, DayOfWeek, ShiftType, DndData } from '../types';

const roleColors: Record<Role, string> = {
  [Role.Chef]: 'bg-red-100 text-red-800',
  [Role.Waiter]: 'bg-blue-100 text-blue-800',
  [Role.Bartender]: 'bg-green-100 text-green-800',
  [Role.Host]: 'bg-yellow-100 text-yellow-800',
};

interface DayCardProps {
    day: DayOfWeek;
    dailySchedule?: DailySchedule;
    employees: Employee[];
    onDrop: (day: DayOfWeek, shift: ShiftType, data: DndData) => void;
    onTimeUpdate: (day: DayOfWeek, shift: ShiftType, start: string, end: string) => void;
    onRemoveEmployee: (day: DayOfWeek, shift: ShiftType, employeeId: number) => void;
}

const ShiftView: React.FC<{
    day: DayOfWeek;
    shiftType: ShiftType;
    shiftData: any;
    allEmployees: Employee[];
    onDrop: DayCardProps['onDrop'];
    onTimeUpdate: DayCardProps['onTimeUpdate'];
    onRemoveEmployee: DayCardProps['onRemoveEmployee'];
    icon: string;
    title: string;
}> = ({ day, shiftType, shiftData, allEmployees, onDrop, onTimeUpdate, onRemoveEmployee, icon, title }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [times, setTimes] = useState({ start: shiftData.start_time, end: shiftData.end_time });

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, employeeId: number) => {
        const data: DndData = { employeeId, source: { day, shift: shiftType } };
        e.dataTransfer.setData('application/json', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        const data: DndData = JSON.parse(e.dataTransfer.getData('application/json'));
        onDrop(day, shiftType, data);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };
    
    const handleDragLeave = () => setIsDragOver(false);

    const handleTimeSave = () => {
        onTimeUpdate(day, shiftType, times.start, times.end);
        setIsEditingTime(false);
    }

    const employeeIds = Object.values(shiftData.employees || {}).flat() as number[];
    const assignedEmployees = employeeIds.map(id => allEmployees.find(emp => emp.id === id)).filter(Boolean) as Employee[];

    return (
        <div>
            <h4 className="font-semibold text-sm text-slate-500 mb-2 flex items-center justify-between">
                <span><i className={`${icon} mr-2`}></i>{title}</span>
                {!isEditingTime ? (
                    <button onClick={() => setIsEditingTime(true)} className="text-xs font-mono bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded">
                        {shiftData.start_time} - {shiftData.end_time} <i className="fa-solid fa-pencil text-[10px] ml-1 opacity-50"></i>
                    </button>
                ) : (
                    <div className="flex items-center gap-1">
                        <input type="time" value={times.start} onChange={e => setTimes(t => ({...t, start: e.target.value}))} className="w-20 text-xs p-0 border border-slate-300 rounded"/>
                        <input type="time" value={times.end} onChange={e => setTimes(t => ({...t, end: e.target.value}))} className="w-20 text-xs p-0 border border-slate-300 rounded"/>
                        <button onClick={handleTimeSave} className="text-green-600 hover:text-green-800"><i className="fa-solid fa-check"></i></button>
                        <button onClick={() => setIsEditingTime(false)} className="text-red-500 hover:text-red-700"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                )}
            </h4>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex flex-wrap gap-2 min-h-[48px] p-2 rounded-lg transition-all ${isDragOver ? 'bg-indigo-50 ring-2 ring-indigo-300 ring-dashed' : 'bg-slate-100'}`}
            >
                {assignedEmployees.map((emp) => (
                    <div
                        key={emp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, emp.id)}
                        className={`flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-full cursor-grab active:cursor-grabbing ${roleColors[emp.role]}`}
                    >
                        <span>{emp.name}</span>
                        <button 
                            onClick={() => onRemoveEmployee(day, shiftType, emp.id)}
                            className="w-4 h-4 rounded-full bg-black/10 hover:bg-black/20 text-black/50 hover:text-black/70 flex items-center justify-center text-[10px]"
                            aria-label={`Remove ${emp.name}`}
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                ))}
                {assignedEmployees.length === 0 && !isDragOver && (
                    <p className="text-xs text-slate-400 text-center w-full">Arrastre un empleado aquí</p>
                )}
                 {isDragOver && (
                    <p className="text-xs text-indigo-500 font-semibold text-center w-full">Asignar a {title}</p>
                )}
            </div>
        </div>
    )
}

export const DayCard: React.FC<DayCardProps> = ({ day, dailySchedule, employees, onDrop, onTimeUpdate, onRemoveEmployee }) => {
    if (!dailySchedule) return null;

    return (
        <div className="bg-slate-50 rounded-lg p-4 flex flex-col">
            <h3 className="font-bold text-lg text-center text-slate-700 mb-3 capitalize">{day}</h3>
            <div className="space-y-4 flex-grow">
                <ShiftView 
                    day={day}
                    shiftType={ShiftType.Almuerzo}
                    shiftData={dailySchedule.almuerzo}
                    allEmployees={employees}
                    onDrop={onDrop}
                    onTimeUpdate={onTimeUpdate}
                    onRemoveEmployee={onRemoveEmployee}
                    icon="fa-regular fa-sun"
                    title="Almuerzo"
                />
                 <ShiftView 
                    day={day}
                    shiftType={ShiftType.Cena}
                    shiftData={dailySchedule.cena}
                    allEmployees={employees}
                    onDrop={onDrop}
                    onTimeUpdate={onTimeUpdate}
                    onRemoveEmployee={onRemoveEmployee}
                    icon="fa-regular fa-moon"
                    title="Cena"
                />
            </div>
        </div>
    )
};
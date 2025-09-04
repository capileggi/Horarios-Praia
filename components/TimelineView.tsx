import React, { useState, useEffect } from 'react';
import { ScheduleData, DayOfWeek, Role, Employee, ShiftType, DndData, DailySchedule, Shift } from '../types';

const roleColors: Record<Role, string> = {
    [Role.Chef]: 'bg-red-500 border-red-700',
    [Role.Waiter]: 'bg-blue-500 border-blue-700',
    [Role.Bartender]: 'bg-green-500 border-green-700',
    [Role.Host]: 'bg-yellow-400 border-yellow-600',
};

const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const generateTimeSlots = (startHour: number, endHour: number, interval: number): string[] => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += interval) {
            const h = hour.toString().padStart(2, '0');
            const m = minute.toString().padStart(2, '0');
            slots.push(`${h}:${m}`);
        }
    }
    return slots;
};

const EditableTime: React.FC<{
    day: DayOfWeek;
    shiftType: ShiftType;
    shift: Shift;
    onTimeUpdate: (day: DayOfWeek, shift: ShiftType, start: string, end: string) => void;
    icon: string;
}> = ({ day, shiftType, shift, onTimeUpdate, icon }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [times, setTimes] = useState({ start: shift.start_time, end: shift.end_time });

    useEffect(() => {
        setTimes({ start: shift.start_time, end: shift.end_time });
    }, [shift.start_time, shift.end_time]);

    const handleSave = () => {
        onTimeUpdate(day, shiftType, times.start, times.end);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 p-1 bg-white rounded-md shadow z-10 relative">
                <input type="time" value={times.start} onChange={e => setTimes(t => ({ ...t, start: e.target.value }))} className="w-20 text-xs p-0 border border-slate-300 rounded" />
                <input type="time" value={times.end} onChange={e => setTimes(t => ({ ...t, end: e.target.value }))} className="w-20 text-xs p-0 border border-slate-300 rounded" />
                <button onClick={handleSave} className="text-green-600 hover:text-green-800"><i className="fa-solid fa-check"></i></button>
                <button onClick={() => setIsEditing(false)} className="text-red-500 hover:text-red-700"><i className="fa-solid fa-xmark"></i></button>
            </div>
        );
    }

    return (
        <button onClick={() => setIsEditing(true)} className="text-xs font-mono bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded w-full text-left transition-colors">
            <i className={`${icon} mr-1 text-slate-400`}></i> {times.start} - {times.end} <i className="fa-solid fa-pencil text-[10px] ml-1 opacity-0 group-hover:opacity-50 transition-opacity"></i>
        </button>
    );
};

interface TimelineViewProps {
    schedule: ScheduleData;
    employees: Employee[];
    onDrop: (day: DayOfWeek, shift: ShiftType, data: DndData) => void;
    onTimeUpdate: (day: DayOfWeek, shift: ShiftType, start: string, end: string) => void;
    onRemoveEmployee: (day: DayOfWeek, shift: ShiftType, employeeId: number) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ schedule, employees, onDrop, onTimeUpdate, onRemoveEmployee }) => {
    const timeSlots = generateTimeSlots(10, 24, 60);
    const days = Object.values(DayOfWeek);
    const [dragOverCell, setDragOverCell] = useState<{ day: DayOfWeek, time: string } | null>(null);

    const getShiftForSlot = (daySchedule: DailySchedule, time: string): ShiftType | null => {
        const currentTimeInMinutes = timeToMinutes(time);
        for (const shiftType of Object.values(ShiftType)) {
            const shift = daySchedule[shiftType];
            if (shift && shift.start_time && shift.end_time) {
                const startMinutes = timeToMinutes(shift.start_time);
                const endMinutes = timeToMinutes(shift.end_time);
                if (currentTimeInMinutes >= startMinutes && currentTimeInMinutes < endMinutes) {
                    return shiftType;
                }
            }
        }
        return null;
    };

    const getEmployeesForSlot = (daySchedule: DailySchedule, time: string, allEmployees: Employee[]): { employee: Employee; shiftType: ShiftType }[] => {
        const shiftType = getShiftForSlot(daySchedule, time);
        if (!shiftType) return [];
        
        const shift = daySchedule[shiftType];
        const workingEmployees: { employee: Employee; shiftType: ShiftType }[] = [];
        const addedIds = new Set<number>();

        Object.values(shift.employees).forEach((employeeIds: any) => {
            (employeeIds || []).forEach((id: number) => {
                if (addedIds.has(id)) return;
                const employee = allEmployees.find(e => e.id === id);
                if (employee) {
                    workingEmployees.push({ employee, shiftType });
                    addedIds.add(id);
                }
            });
        });
        return workingEmployees;
    };

    const handleDrop = (e: React.DragEvent<HTMLTableDataCellElement>, day: DayOfWeek, time: string) => {
        e.preventDefault();
        setDragOverCell(null);
        const targetShift = getShiftForSlot(schedule[day], time);
        if (!targetShift) return;

        const data: DndData = JSON.parse(e.dataTransfer.getData('application/json'));
        onDrop(day, targetShift, data);
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableDataCellElement>, day: DayOfWeek, time: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverCell({ day, time });
    };

    const handleDragLeave = () => setDragOverCell(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, employeeId: number, day: DayOfWeek, shift: ShiftType) => {
        const data: DndData = { employeeId, source: { day, shift } };
        e.dataTransfer.setData('application/json', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="overflow-x-auto bg-slate-50 p-4 rounded-lg border border-slate-200">
            <table className="min-w-full border-collapse">
                <thead>
                    <tr className="border-b-2 border-slate-300">
                        <th className="sticky left-0 bg-slate-50 p-2 text-sm font-semibold text-slate-600 text-left w-20 z-20">Hora</th>
                        {days.map(day => (
                            <th key={day} className="p-2 text-sm font-semibold text-slate-600 capitalize min-w-[200px]">{day}</th>
                        ))}
                    </tr>
                    <tr className="border-b-2 border-slate-300">
                        <th className="sticky left-0 bg-slate-50 z-20"></th>
                        {days.map(day => (
                            <th key={`${day}-times`} className="p-1 align-top group">
                                <div className="space-y-1">
                                    <EditableTime day={day} shiftType={ShiftType.Almuerzo} shift={schedule[day].almuerzo} onTimeUpdate={onTimeUpdate} icon="fa-regular fa-sun"/>
                                    <EditableTime day={day} shiftType={ShiftType.Cena} shift={schedule[day].cena} onTimeUpdate={onTimeUpdate} icon="fa-regular fa-moon"/>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {timeSlots.map(time => (
                        <tr key={time} className="border-b border-slate-200">
                            <td className="sticky left-0 bg-slate-50/95 backdrop-blur-sm p-2 text-xs font-mono text-slate-500 whitespace-nowrap align-top z-20">{time}</td>
                            {days.map(day => {
                                const workingEmployees = getEmployeesForSlot(schedule[day], time, employees);
                                const isDraggedOver = dragOverCell?.day === day && dragOverCell?.time === time;
                                const canDrop = isDraggedOver && getShiftForSlot(schedule[day], time) !== null;
                                return (
                                    <td key={`${day}-${time}`} className={`p-1.5 align-top transition-colors min-h-[40px] ${canDrop ? 'bg-indigo-200' : isDraggedOver ? 'bg-red-100' : 'hover:bg-slate-100/75'}`}
                                        onDrop={(e) => handleDrop(e, day, time)}
                                        onDragOver={(e) => handleDragOver(e, day, time)}
                                        onDragLeave={handleDragLeave}
                                    >
                                        <div className="grid grid-cols-1 gap-1">
                                            {workingEmployees.map(({ employee, shiftType }) => (
                                                <div
                                                    key={employee.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, employee.id, day, shiftType)}
                                                    title={`${employee.name} (${employee.role})`}
                                                    className={`flex items-center justify-between text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm truncate border-b-2 cursor-grab active:cursor-grabbing ${roleColors[employee.role]}`}
                                                >
                                                    <span>{employee.name}</span>
                                                     <button
                                                        onClick={() => onRemoveEmployee(day, shiftType, employee.id)}
                                                        className="w-4 h-4 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center"
                                                        aria-label={`Remove ${employee.name}`}
                                                    >
                                                        <i className="fa-solid fa-xmark"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
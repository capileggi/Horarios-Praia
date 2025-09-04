
import React, { useState } from 'react';
import { ScheduleData, Role, DayOfWeek, ShiftType, Employee, DndData, EmployeeHours } from '../types';
import { TimelineView } from './TimelineView';
import { DayCard } from './DayCard';
import { HoursSummaryView } from './HoursSummaryView';

interface ScheduleViewProps {
    schedule: ScheduleData;
    employees: Employee[];
    onScheduleUpdate: (newSchedule: ScheduleData) => void;
    employeeHours: { [employeeId: number]: EmployeeHours };
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, employees, onScheduleUpdate, employeeHours }) => {
  const [viewMode, setViewMode] = useState<'daily' | 'timeline' | 'summary'>('daily');
  const days = Object.values(DayOfWeek);

  const buttonBaseStyle = "px-4 py-2 text-sm font-bold rounded-md transition-colors duration-200 focus:outline-none";
  const activeButtonStyle = "bg-white text-indigo-600 shadow";
  const inactiveButtonStyle = "bg-transparent text-slate-500 hover:bg-slate-200/50";

  const handleDrop = (targetDay: DayOfWeek, targetShift: ShiftType, data: DndData) => {
    const { employeeId, source } = data;
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const newSchedule = JSON.parse(JSON.stringify(schedule));

    // Remove from source if it's from another shift
    if (source) {
        if(source.day === targetDay && source.shift === targetShift) return; // Dropped in the same place
        const sourceShiftEmployees = newSchedule[source.day][source.shift].employees;
        const roleArray = sourceShiftEmployees[employee.role] as number[] | undefined;
        if (roleArray) {
            const index = roleArray.indexOf(employeeId);
            if (index > -1) {
                roleArray.splice(index, 1);
            }
        }
    }

    // Add to target
    const targetShiftEmployees = newSchedule[targetDay][targetShift].employees;
    if (!targetShiftEmployees[employee.role]) {
        targetShiftEmployees[employee.role] = [];
    }
    const targetRoleArray = targetShiftEmployees[employee.role] as number[];
    if (!targetRoleArray.includes(employeeId)) {
        targetRoleArray.push(employeeId);
    }
    
    onScheduleUpdate(newSchedule);
  };

  const handleTimeUpdate = (day: DayOfWeek, shift: ShiftType, start_time: string, end_time: string) => {
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    newSchedule[day][shift].start_time = start_time;
    newSchedule[day][shift].end_time = end_time;
    onScheduleUpdate(newSchedule);
  }

  const handleRemoveEmployee = (day: DayOfWeek, shift: ShiftType, employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const newSchedule = JSON.parse(JSON.stringify(schedule));
    const shiftEmployees = newSchedule[day][shift].employees;
    
    const roleArray = shiftEmployees[employee.role] as number[] | undefined;
    if (roleArray) {
        const index = roleArray.indexOf(employeeId);
        if (index > -1) {
            roleArray.splice(index, 1);
        }
    }
    onScheduleUpdate(newSchedule);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Horario Semanal</h2>
        <div className="flex items-center space-x-1 bg-slate-200/75 p-1 rounded-lg">
             <button 
                onClick={() => setViewMode('daily')}
                className={`${buttonBaseStyle} ${viewMode === 'daily' ? activeButtonStyle : inactiveButtonStyle}`}
                aria-pressed={viewMode === 'daily'}
            >
                <i className="fa-solid fa-grip-vertical mr-2"></i>Diaria
            </button>
            <button 
                onClick={() => setViewMode('timeline')}
                className={`${buttonBaseStyle} ${viewMode === 'timeline' ? activeButtonStyle : inactiveButtonStyle}`}
                aria-pressed={viewMode === 'timeline'}
            >
                <i className="fa-solid fa-chart-gantt mr-2"></i>Línea de Tiempo
            </button>
            <button 
                onClick={() => setViewMode('summary')}
                className={`${buttonBaseStyle} ${viewMode === 'summary' ? activeButtonStyle : inactiveButtonStyle}`}
                aria-pressed={viewMode === 'summary'}
            >
                <i className="fa-solid fa-stopwatch mr-2"></i>Resumen
            </button>
        </div>
      </div>

      {viewMode === 'daily' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {days.map(day => (
                <DayCard 
                    key={day} 
                    day={day} 
                    dailySchedule={schedule[day]} 
                    employees={employees}
                    onDrop={handleDrop}
                    onTimeUpdate={handleTimeUpdate}
                    onRemoveEmployee={handleRemoveEmployee}
                />
            ))}
            {/* Placeholder for alignment on 7-day week */}
            <div className="hidden xl:block"></div>
        </div>
      ) : viewMode === 'timeline' ? (
        <TimelineView 
            schedule={schedule} 
            employees={employees} 
            onDrop={handleDrop}
            onTimeUpdate={handleTimeUpdate}
            onRemoveEmployee={handleRemoveEmployee}
        />
      ) : (
        <HoursSummaryView employees={employees} employeeHours={employeeHours} />
      )}
    </div>
  );
};

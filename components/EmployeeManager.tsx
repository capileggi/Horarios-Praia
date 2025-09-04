
import React, { useState } from 'react';
import { Employee, Role, DndData, ScheduleData, EmployeeHours } from '../types';
import { RoleIcon } from './RoleIcon';

interface EmployeeManagerProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  schedule: ScheduleData | null;
  onScheduleUpdate: (newSchedule: ScheduleData) => void;
  employeeHours: { [employeeId: number]: EmployeeHours };
  onEditSchedule: (employeeId: number) => void;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, setEmployees, schedule, onScheduleUpdate, employeeHours, onEditSchedule }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(Role.Waiter);
  const [availability, setAvailability] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newEmployee: Employee = {
      id: Date.now(),
      name,
      role,
      availability: availability || 'Sin restricciones',
    };
    setEmployees(prev => [...prev, newEmployee]);
    setName('');
    setRole(Role.Waiter);
    setAvailability('');
  };

  const removeEmployee = (id: number) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    
    // Also remove from schedule if it exists
    if(schedule) {
        const newSchedule = JSON.parse(JSON.stringify(schedule));
        const employee = employees.find(emp => emp.id === id);
        if (!employee) return;

        for (const day of Object.keys(newSchedule)) {
            for (const shift of Object.keys(newSchedule[day])) {
                const shiftEmployees = newSchedule[day][shift].employees;
                const roleArray = shiftEmployees[employee.role] as number[] | undefined;
                if (roleArray) {
                    const index = roleArray.indexOf(id);
                    if (index > -1) {
                        roleArray.splice(index, 1);
                    }
                }
            }
        }
        onScheduleUpdate(newSchedule);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, employeeId: number) => {
    const data: DndData = { employeeId };
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!schedule) return;

    const data: DndData = JSON.parse(e.dataTransfer.getData('application/json'));
    const { employeeId, source } = data;

    // Only handle drops from the schedule (unassigning)
    if (!source) return;

    const newSchedule = JSON.parse(JSON.stringify(schedule));
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    // Remove employee from source shift
    const sourceShiftEmployees = newSchedule[source.day][source.shift].employees;
    const roleArray = sourceShiftEmployees[employee.role] as number[] | undefined;
    if (roleArray) {
        const index = roleArray.indexOf(employeeId);
        if (index > -1) {
            roleArray.splice(index, 1);
        }
    }
    
    onScheduleUpdate(newSchedule);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold text-slate-700 mb-4">Gestionar Empleados</h2>
      <form onSubmit={handleAddEmployee} className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Nombre del empleado"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input
          type="text"
          placeholder="Disponibilidad (ej. No fines de semana)"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="w-full bg-slate-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors">
          <i className="fa-solid fa-plus mr-2"></i>Añadir Empleado
        </button>
      </form>

      <div 
        className={`space-y-3 max-h-60 overflow-y-auto pr-2 p-2 rounded-lg transition-all ${isDragOver ? 'bg-indigo-100 ring-2 ring-indigo-400' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <p className={`text-center text-xs text-slate-400 transition-opacity ${isDragOver ? 'opacity-100' : 'opacity-0'}`}>Soltar aquí para desasignar</p>
        {employees.map(employee => (
          <div 
            key={employee.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, employee.id)}
            className="flex items-center justify-between bg-slate-50 p-3 rounded-lg cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center">
              <RoleIcon role={employee.role} />
              <div>
                <p className="font-semibold text-slate-800">{employee.name}</p>
                <p className="text-xs text-slate-500">{employee.role} - {employee.availability}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {(employeeHours[employee.id]?.weekly ?? 0).toFixed(1)}h
                </span>
                 <button 
                    onClick={() => onEditSchedule(employee.id)} 
                    className="text-slate-500 hover:text-indigo-600 disabled:text-slate-300 disabled:cursor-not-allowed"
                    disabled={!schedule}
                    aria-label={`Editar horario de ${employee.name}`}
                    title="Editar horario"
                >
                    <i className="fa-solid fa-calendar-days"></i>
                </button>
                <button onClick={() => removeEmployee(employee.id)} className="text-red-400 hover:text-red-600">
                    <i className="fa-solid fa-trash-can"></i>
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

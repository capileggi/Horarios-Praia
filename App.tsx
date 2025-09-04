
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Employee, Role, ScheduleData, DayOfWeek, EmployeeHours, ShiftType, DemandData } from './types';
import { generateSchedule, parseRequirements } from './services/geminiService';
import { EmployeeManager } from './components/EmployeeManager';
import { ScheduleView } from './components/ScheduleView';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import EditEmployeeScheduleModal from './components/EditEmployeeScheduleModal';
import { StaffingDemandChart } from './components/StaffingDemandChart';

const initialEmployees: Employee[] = [
  { id: 1, name: 'Ana García', role: Role.Chef, availability: 'No disponible los fines de semana' },
  { id: 2, name: 'Luis Fernández', role: Role.Waiter, availability: 'Disponible todas las noches' },
  { id: 3, name: 'Sofía Martínez', role: Role.Waiter, availability: 'Prefiere turnos de almuerzo' },
  { id: 4, name: 'Carlos Pileggi', role: Role.Bartender, availability: 'Disponible jueves a domingo' },
  { id: 5, name: 'Elena Pérez', role: Role.Host, availability: 'Turnos flexibles' },
  { id: 6, name: 'Miguel Sánchez', role: Role.Chef, availability: 'Solo fines de semana' },
  { id: 7, name: 'Lucía Gómez', role: Role.Waiter, availability: 'No disponible los lunes' },
];

const initialRequirements = "Se necesita 1 Chef, 2 Camareros y 1 Anfitrión para el turno de almuerzo. Para el turno de cena, se necesita 1 Chef, 3 Camareros, 1 Bartender y 1 Anfitrión. Los fines de semana, se necesita un chef adicional para cada turno.";

const timeStringToHours = (time: string): number => {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
};

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [demand, setDemand] = useState<DemandData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [requirements, setRequirements] = useState<string>(initialRequirements);
  const [isEditingRequirements, setIsEditingRequirements] = useState<boolean>(false);
  const [editedRequirements, setEditedRequirements] = useState<string>(requirements);

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    // Parse initial requirements on load
    const parseInitialRequirements = async () => {
        try {
            const parsedDemand = await parseRequirements(initialRequirements);
            setDemand(parsedDemand);
        } catch (err) {
            console.error("Failed to parse initial requirements:", err);
            // You might want to set some default demand or error state here
        }
    };
    parseInitialRequirements();
  }, []);

  const employeeHours = useMemo(() => {
    if (!schedule) return {};

    const hoursByEmployee: { [employeeId: number]: EmployeeHours } = {};
    employees.forEach(emp => {
      hoursByEmployee[emp.id] = { daily: {}, weekly: 0 };
    });

    for (const day of Object.values(DayOfWeek)) {
        for (const shift of Object.values(schedule[day])) {
            const shiftDuration = timeStringToHours(shift.end_time) - timeStringToHours(shift.start_time);
            if (shiftDuration <= 0) continue;

            Object.values(shift.employees).forEach(employeeIds => {
                (employeeIds as number[]).forEach(id => {
                    if (hoursByEmployee[id]) {
                        hoursByEmployee[id].daily[day] = (hoursByEmployee[id].daily[day] || 0) + shiftDuration;
                        hoursByEmployee[id].weekly += shiftDuration;
                    }
                });
            });
        }
    }
    return hoursByEmployee;
  }, [schedule, employees]);


  const handleGenerateSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSchedule(null);
    try {
      const generatedSchedule = await generateSchedule(employees, requirements);
      setSchedule(generatedSchedule);
    } catch (err) {
      console.error(err);
      setError('No se pudo generar el horario. Verifique la clave de API y vuelva a intentarlo.');
    } finally {
      setIsLoading(false);
    }
  }, [employees, requirements]);

  const handleScheduleUpdate = (updatedSchedule: ScheduleData) => {
    setSchedule(updatedSchedule);
  };
  
  const handleEditRequirementsClick = () => {
    setEditedRequirements(requirements);
    setIsEditingRequirements(true);
  };

  const handleSaveRequirements = async () => {
      setRequirements(editedRequirements);
      setIsEditingRequirements(false);
      try {
        const parsedDemand = await parseRequirements(editedRequirements);
        setDemand(parsedDemand);
      } catch (err) {
        console.error("Failed to parse requirements on save:", err);
        setError("No se pudieron analizar los nuevos requisitos.");
      }
  };

  const handleCancelRequirements = () => {
      setIsEditingRequirements(false);
  };

  const handleUpdateEmployeeSchedule = (
    employeeId: number,
    assignments: { [key in DayOfWeek]: { lunch: boolean; dinner: boolean } }
  ) => {
    if (!schedule) return;
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const newSchedule = JSON.parse(JSON.stringify(schedule));

    for (const day of Object.values(DayOfWeek)) {
        // Handle Lunch Shift
        const lunchShiftEmployees = newSchedule[day][ShiftType.Almuerzo].employees;
        if (!lunchShiftEmployees[employee.role]) lunchShiftEmployees[employee.role] = [];
        const lunchRoleArray = lunchShiftEmployees[employee.role] as number[];
        const lunchIndex = lunchRoleArray.indexOf(employeeId);

        if (assignments[day].lunch) {
            if (lunchIndex === -1) {
                lunchRoleArray.push(employeeId);
            }
        } else {
            if (lunchIndex > -1) {
                lunchRoleArray.splice(lunchIndex, 1);
            }
        }

        // Handle Dinner Shift
        const dinnerShiftEmployees = newSchedule[day][ShiftType.Cena].employees;
        if (!dinnerShiftEmployees[employee.role]) dinnerShiftEmployees[employee.role] = [];
        const dinnerRoleArray = dinnerShiftEmployees[employee.role] as number[];
        const dinnerIndex = dinnerRoleArray.indexOf(employeeId);

        if (assignments[day].dinner) {
            if (dinnerIndex === -1) {
                dinnerRoleArray.push(employeeId);
            }
        } else {
            if (dinnerIndex > -1) {
                dinnerRoleArray.splice(dinnerIndex, 1);
            }
        }
    }
    
    setSchedule(newSchedule);
    setEditingEmployee(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/50 text-slate-800">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <EmployeeManager 
                employees={employees} 
                setEmployees={setEmployees}
                schedule={schedule}
                onScheduleUpdate={handleScheduleUpdate}
                employeeHours={employeeHours}
                onEditSchedule={(employeeId) => setEditingEmployee(employees.find(e => e.id === employeeId) || null)}
            />
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-bold text-slate-700">Requisitos del Turno</h2>
                    {!isEditingRequirements ? (
                        <button onClick={handleEditRequirementsClick} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                            <i className="fa-solid fa-pencil mr-1"></i>
                            Editar
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button onClick={handleSaveRequirements} className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md transition-colors">
                                Guardar
                            </button>
                            <button onClick={handleCancelRequirements} className="text-sm font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded-md transition-colors">
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>

                {!isEditingRequirements ? (
                    <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap min-h-[100px]">{requirements}</p>
                ) : (
                    <textarea
                        value={editedRequirements}
                        onChange={(e) => setEditedRequirements(e.target.value)}
                        className="w-full h-40 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-4"
                        aria-label="Editar requisitos del turno"
                    />
                )}
                
                <button
                    onClick={handleGenerateSchedule}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <>
                            <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                            Generar Horario
                        </>
                    )}
                </button>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg min-h-[400px] flex flex-col justify-center items-center">
                {isLoading && (
                    <div className="text-center">
                        <i className="fa-solid fa-sync fa-spin text-4xl text-indigo-500 mb-4"></i>
                        <p className="text-lg font-semibold text-slate-600">Generando horario inteligente...</p>
                        <p className="text-sm text-slate-500">Esto puede tardar unos segundos.</p>
                    </div>
                )}
                {error && <p className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>}
                {!isLoading && !schedule && !error && (
                    <div className="text-center">
                        <i className="fa-regular fa-calendar-days text-5xl text-slate-400 mb-4"></i>
                        <h3 className="text-xl font-bold text-slate-700">Bienvenido al Planificador de Horarios</h3>
                        <p className="text-slate-500 mt-2">Agregue sus empleados y haga clic en 'Generar Horario' para comenzar.</p>
                    </div>
                )}
                {schedule && <ScheduleView schedule={schedule} employees={employees} onScheduleUpdate={handleScheduleUpdate} employeeHours={employeeHours} />}
            </div>
            {schedule && demand && (
                <StaffingDemandChart schedule={schedule} demand={demand} />
            )}
          </div>
        </div>
      </main>
      {editingEmployee && schedule && (
          <EditEmployeeScheduleModal 
              employee={editingEmployee}
              schedule={schedule}
              onClose={() => setEditingEmployee(null)}
              onSave={handleUpdateEmployeeSchedule}
          />
      )}
    </div>
  );
};

export default App;

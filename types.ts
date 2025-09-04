
export enum Role {
  Chef = 'Chef',
  Waiter = 'Camarero',
  Bartender = 'Bartender',
  Host = 'Anfitrión',
}

export enum DayOfWeek {
    Lunes = 'lunes',
    Martes = 'martes',
    Miercoles = 'miercoles',
    Jueves = 'jueves',
    Viernes = 'viernes',
    Sabado = 'sabado',
    Domingo = 'domingo',
}

export enum ShiftType {
    Almuerzo = 'almuerzo',
    Cena = 'cena',
}

export interface Employee {
  id: number;
  name: string;
  role: Role;
  availability: string;
}

export interface ShiftAssignment {
    [Role.Chef]?: number[];
    [Role.Waiter]?: number[];
    [Role.Bartender]?: number[];
    [Role.Host]?: number[];
}

export interface Shift {
    start_time: string;
    end_time: string;
    employees: ShiftAssignment;
}

export interface DailySchedule {
    [ShiftType.Almuerzo]: Shift;
    [ShiftType.Cena]: Shift;
}

export type ScheduleData = {
    [key in DayOfWeek]: DailySchedule;
};

// Types for Demand Data
export interface RoleDemand {
    [Role.Chef]?: number;
    [Role.Waiter]?: number;
    [Role.Bartender]?: number;
    [Role.Host]?: number;
}

export interface DailyDemand {
    [ShiftType.Almuerzo]: RoleDemand;
    [ShiftType.Cena]: RoleDemand;
}

export type DemandData = {
    [key in DayOfWeek]: DailyDemand;
}

// Type for drag-and-drop data transfer
export interface DndData {
    employeeId: number;
    source?: {
        day: DayOfWeek;
        shift: ShiftType;
    };
}

export interface EmployeeHours {
    daily: { [key in DayOfWeek]?: number };
    weekly: number;
}

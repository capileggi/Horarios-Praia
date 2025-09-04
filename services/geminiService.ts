
import { GoogleGenAI, Type } from "@google/genai";
import { Employee, ScheduleData, DayOfWeek, Role, DemandData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const cleanJsonString = (text: string): string => {
    return text.replace(/^```json\s*|```\s*$/g, '');
}

export const parseRequirements = async (requirements: string): Promise<DemandData> => {
    const prompt = `
        Analiza los siguientes requisitos de personal de un restaurante y conviértelos en un objeto JSON estructurado que represente la demanda para cada rol, en cada turno (almuerzo y cena), para cada día de la semana (lunes a domingo).

        Requisitos:
        "${requirements}"

        Instrucciones:
        1.  Interpreta frases como "fines de semana" como sábado y domingo.
        2.  Si un rol no se menciona para un turno específico, establece su valor en 0.
        3.  El resultado debe ser únicamente un objeto JSON que siga el esquema proporcionado. No incluyas explicaciones.
    `;

    const roleDemandProperties = {
        [Role.Chef]: { type: Type.INTEGER, description: 'Número de chefs necesarios.' },
        [Role.Waiter]: { type: Type.INTEGER, description: 'Número de camareros necesarios.' },
        [Role.Bartender]: { type: Type.INTEGER, description: 'Número de bartenders necesarios.' },
        [Role.Host]: { type: Type.INTEGER, description: 'Número de anfitriones necesarios.' },
    };

    const dailyDemandProperties = {
        almuerzo: { type: Type.OBJECT, properties: roleDemandProperties, description: "Demanda para el turno de almuerzo." },
        cena: { type: Type.OBJECT, properties: roleDemandProperties, description: "Demanda para el turno de cena." },
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            [DayOfWeek.Lunes]: { type: Type.OBJECT, properties: dailyDemandProperties },
            [DayOfWeek.Martes]: { type: Type.OBJECT, properties: dailyDemandProperties },
            [DayOfWeek.Miercoles]: { type: Type.OBJECT, properties: dailyDemandProperties },
            [DayOfWeek.Jueves]: { type: Type.OBJECT, properties: dailyDemandProperties },
            [DayOfWeek.Viernes]: { type: Type.OBJECT, properties: dailyDemandProperties },
            [DayOfWeek.Sabado]: { type: Type.OBJECT, properties: dailyDemandProperties },
            [DayOfWeek.Domingo]: { type: Type.OBJECT, properties: dailyDemandProperties },
        },
        required: Object.values(DayOfWeek),
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        const cleanedText = cleanJsonString(response.text.trim());
        return JSON.parse(cleanedText) as DemandData;
    } catch (error) {
        console.error("Error parsing requirements with Gemini:", error);
        throw new Error("Failed to parse requirements.");
    }
};

export const generateSchedule = async (employees: Employee[], requirements: string): Promise<ScheduleData> => {
  const prompt = `
    Eres un experto gerente de restaurante encargado de crear un horario semanal justo y equilibrado para los empleados.
    
    Basado en la siguiente lista de empleados, sus roles, disponibilidad y IDs únicos, junto con los requisitos del turno, genera un horario completo para la semana (lunes a domingo).

    Empleados:
    ${JSON.stringify(employees, null, 2)}

    Requisitos del turno:
    ${requirements}

    Consideraciones importantes:
    1. Para cada turno, define un 'start_time' y 'end_time' en formato HH:MM (ej. '12:00', '16:00'). El turno de almuerzo suele ser de 12:00 a 16:00 y el de cena de 19:00 a 23:00, pero puedes ajustarlo si es necesario.
    2. En la estructura de 'employees' del turno, utiliza el 'id' numérico del empleado, no su nombre.
    3. Respeta la disponibilidad de cada empleado de la manera más estricta posible.
    4. Distribuye los turnos de manera equitativa para evitar el agotamiento.
    5. Asegúrate de que se cumplan todos los roles requeridos para cada turno.
    6. El resultado debe ser un objeto JSON que siga estrictamente el esquema proporcionado. No incluyas ninguna explicación adicional, solo el JSON.
    7. Para cualquier turno o rol que no tenga un empleado asignado, devuelve un array vacío [].
  `;

  const shiftAssignmentProperties = {
    [Role.Chef]: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: 'Lista de IDs de chefs asignados a este turno.' },
    [Role.Waiter]: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: 'Lista de IDs de camareros asignados a este turno.' },
    [Role.Bartender]: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: 'Lista de IDs de bartenders asignados a este turno.' },
    [Role.Host]: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: 'Lista de IDs de anfitriones asignados a este turno.' },
  };

  const shiftProperties = {
    start_time: { type: Type.STRING, description: 'Hora de inicio del turno (formato HH:MM).' },
    end_time: { type: Type.STRING, description: 'Hora de fin del turno (formato HH:MM).' },
    employees: { type: Type.OBJECT, properties: shiftAssignmentProperties, description: 'IDs de empleados asignados al turno.' }
  };

  const dailyScheduleProperties = {
      almuerzo: { type: Type.OBJECT, properties: shiftProperties, description: "Horario del turno de almuerzo." },
      cena: { type: Type.OBJECT, properties: shiftProperties, description: "Horario del turno de cena." },
  };
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      [DayOfWeek.Lunes]: { type: Type.OBJECT, properties: dailyScheduleProperties },
      [DayOfWeek.Martes]: { type: Type.OBJECT, properties: dailyScheduleProperties },
      [DayOfWeek.Miercoles]: { type: Type.OBJECT, properties: dailyScheduleProperties },
      [DayOfWeek.Jueves]: { type: Type.OBJECT, properties: dailyScheduleProperties },
      [DayOfWeek.Viernes]: { type: Type.OBJECT, properties: dailyScheduleProperties },
      [DayOfWeek.Sabado]: { type: Type.OBJECT, properties: dailyScheduleProperties },
      [DayOfWeek.Domingo]: { type: Type.OBJECT, properties: dailyScheduleProperties },
    },
    required: Object.values(DayOfWeek),
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });
    
    const cleanedText = cleanJsonString(response.text.trim());
    return JSON.parse(cleanedText) as ScheduleData;

  } catch (error) {
    console.error("Error generating schedule with Gemini:", error);
    throw new Error("Failed to generate schedule. Please check API key and configuration.");
  }
};

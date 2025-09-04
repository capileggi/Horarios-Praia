
import React, { useMemo, useState } from 'react';
import { ScheduleData, DemandData, DayOfWeek, ShiftType } from '../types';

interface StaffingDemandChartProps {
    schedule: ScheduleData;
    demand: DemandData;
}

const Tooltip: React.FC<{ data: { x: number; y: number; content: React.ReactNode } | null }> = ({ data }) => {
    if (!data) return null;
    return (
        <div
            className="absolute bg-slate-800 text-white text-xs rounded-lg py-1 px-2 shadow-lg pointer-events-none transition-transform transform -translate-x-1/2 -translate-y-full z-10"
            style={{ left: data.x, top: data.y, marginTop: '-8px' }}
        >
            {data.content}
        </div>
    );
};


export const StaffingDemandChart: React.FC<StaffingDemandChartProps> = ({ schedule, demand }) => {
    const days = Object.values(DayOfWeek);
    const [tooltipData, setTooltipData] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);

    const chartData = useMemo(() => {
        if (!schedule || !demand) return null;

        const processShift = (shiftType: ShiftType) => {
            const required = days.map(day =>
                Object.values(demand[day][shiftType] || {}).reduce((sum, count) => sum + (count || 0), 0)
            );
            const staffed = days.map(day =>
                Object.values(schedule[day][shiftType]?.employees || {}).flat().length
            );
            return { required, staffed };
        };

        return {
            lunch: processShift(ShiftType.Almuerzo),
            dinner: processShift(ShiftType.Cena),
        };
    }, [schedule, demand, days]);

    if (!chartData) return null;

    const width = 800;
    const height = 400;
    const padding = { top: 20, right: 20, bottom: 50, left: 40 };

    const contentWidth = width - padding.left - padding.right;
    const contentHeight = height - padding.top - padding.bottom;

    const allValues = [
        ...chartData.lunch.required,
        ...chartData.lunch.staffed,
        ...chartData.dinner.required,
        ...chartData.dinner.staffed,
    ];
    const maxY = Math.ceil(Math.max(...allValues, 5) / 5) * 5; // Round up to nearest 5

    const xScale = (index: number) => padding.left + (index / (days.length - 1)) * contentWidth;
    const yScale = (value: number) => padding.top + contentHeight - (value / maxY) * contentHeight;

    const generatePath = (data: number[], fill: boolean = false) => {
        const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d)}`).join(' ');
        if (fill) {
            return `${path} L ${xScale(days.length - 1)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;
        }
        return path;
    };
    
    const lunchStaffedPath = generatePath(chartData.lunch.staffed, true);
    const lunchRequiredPath = generatePath(chartData.lunch.required);
    const dinnerStaffedPath = generatePath(chartData.dinner.staffed, true);
    const dinnerRequiredPath = generatePath(chartData.dinner.required);
    
    const handleMouseOver = (e: React.MouseEvent, dayIndex: number, shift: 'lunch' | 'dinner') => {
        const target = e.currentTarget as SVGCircleElement;
        const parentRect = target.closest('.relative')?.getBoundingClientRect();
        if (!parentRect) return;
    
        const x = xScale(dayIndex);
        const y = yScale(chartData[shift].staffed[dayIndex]);
        
        const svg = target.ownerSVGElement;
        if(!svg) return;
        const pt = svg.createSVGPoint();
        pt.x = x;
        pt.y = y;
        const clientPoint = pt.matrixTransform(svg.getScreenCTM() as DOMMatrix);
    
        const relativeX = clientPoint.x - parentRect.left;
        const relativeY = clientPoint.y - parentRect.top;
    
        const data = chartData[shift];
        const content = (
            <div className="text-center p-1">
                <p className="font-bold capitalize">{days[dayIndex]}</p>
                <hr className="border-slate-600 my-1"/>
                <p>Requerido: {data.required[dayIndex]}</p>
                <p>Asignado: {data.staffed[dayIndex]}</p>
            </div>
        );
    
        setTooltipData({ x: relativeX, y: relativeY, content });
    };
    
    const handleMouseOut = () => {
        setTooltipData(null);
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-slate-700 mb-4">Análisis de Dotación Semanal</h2>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm mb-4">
                <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-cyan-500/70 mr-2"></div>Asignado (Almuerzo)</div>
                <div className="flex items-center"><div className="w-4 h-1 border-t-2 border-dashed border-cyan-700 mr-2"></div>Requerido (Almuerzo)</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-indigo-500/70 mr-2"></div>Asignado (Cena)</div>
                <div className="flex items-center"><div className="w-4 h-1 border-t-2 border-dashed border-indigo-700 mr-2"></div>Requerido (Cena)</div>
            </div>
            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-labelledby="chart-title">
                    <title id="chart-title">Gráfico de análisis de dotación semanal</title>
                    {/* Y-axis grid lines and labels */}
                    {Array.from({ length: Math.ceil(maxY / 5) + 1 }).map((_, i) => {
                        const yVal = i * 5;
                        const y = yScale(yVal);
                        if (yVal > maxY) return null;
                        return (
                            <g key={`y-grid-${i}`} className="text-slate-400">
                                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,3"/>
                                <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-xs fill-current">{yVal}</text>
                            </g>
                        );
                    })}

                    {/* X-axis labels */}
                    {days.map((day, i) => (
                        <text key={`x-label-${i}`} x={xScale(i)} y={height - padding.bottom + 20} textAnchor="middle" className="text-xs fill-current text-slate-500 font-semibold capitalize">
                            {day.substring(0, 3)}
                        </text>
                    ))}
                    <text x={padding.left + contentWidth / 2} y={height - 5} textAnchor="middle" className="text-sm font-bold fill-current text-slate-700">Día de la Semana</text>
                    <text x={-(padding.top + contentHeight / 2)} y={15} transform="rotate(-90)" textAnchor="middle" className="text-sm font-bold fill-current text-slate-700">Nº de Empleados</text>

                    {/* Data paths */}
                    <path d={dinnerStaffedPath} fill="rgb(99 102 241 / 0.3)" stroke="none" />
                    <path d={lunchStaffedPath} fill="rgb(6 182 212 / 0.3)" stroke="none" />
                    
                    <path d={dinnerRequiredPath} stroke="rgb(67 56 202)" strokeWidth="2" fill="none" strokeDasharray="4,4" />
                    <path d={lunchRequiredPath} stroke="rgb(8 145 178)" strokeWidth="2" fill="none" strokeDasharray="4,4" />
                    
                    <path d={generatePath(chartData.dinner.staffed)} stroke="rgb(99 102 241)" strokeWidth="2.5" fill="none" />
                    <path d={generatePath(chartData.lunch.staffed)} stroke="rgb(6 182 212)" strokeWidth="2.5" fill="none" />
                    
                    {/* Data points for tooltip interaction */}
                     {days.map((_day, i) => {
                         const lunchY = chartData.lunch.staffed[i];
                         const dinnerY = chartData.dinner.staffed[i];
                         return (
                            <g key={`interaction-group-${i}`}>
                                <circle cx={xScale(i)} cy={yScale(lunchY)} r="8" fill="transparent" onMouseOver={(e) => handleMouseOver(e, i, 'lunch')} onMouseOut={handleMouseOut} className="cursor-pointer" />
                                <circle cx={xScale(i)} cy={yScale(dinnerY)} r="8" fill="transparent" onMouseOver={(e) => handleMouseOver(e, i, 'dinner')} onMouseOut={handleMouseOut} className="cursor-pointer" />
                            </g>
                         )
                     })}
                </svg>
                 {tooltipData && <Tooltip data={tooltipData} />}
            </div>
        </div>
    );
};

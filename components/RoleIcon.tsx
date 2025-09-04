
import React from 'react';
import { Role } from '../types';

interface RoleIconProps {
  role: Role;
}

const roleIconMap: Record<Role, { icon: string; color: string }> = {
    [Role.Chef]: { icon: 'fa-solid fa-hat-chef', color: 'text-red-500' },
    [Role.Waiter]: { icon: 'fa-solid fa-user-tie', color: 'text-blue-500' },
    [Role.Bartender]: { icon: 'fa-solid fa-martini-glass-citrus', color: 'text-green-500' },
    [Role.Host]: { icon: 'fa-solid fa-book-open', color: 'text-yellow-500' },
};

export const RoleIcon: React.FC<RoleIconProps> = ({ role }) => {
  const { icon, color } = roleIconMap[role];
  return (
    <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 mr-3 ${color}`}>
      <i className={icon}></i>
    </div>
  );
};

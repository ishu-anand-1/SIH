import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { CommandPalette } from '../common/CommandPalette';
import { ToastContainer } from '../common/ToastContainer';
import { useUI } from '../../context/UIContext';

export const AppShell: React.FC = () => {
  const { sidebarCollapsed } = useUI();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'pl-[72px]' : 'pl-[248px]'
        }`}
      >
        <TopHeader />
        <main className="flex-1 p-6 page-entry">
          <Outlet />
        </main>
      </div>

      <CommandPalette />
      <ToastContainer />
    </div>
  );
};

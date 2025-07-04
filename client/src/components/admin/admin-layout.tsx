import React from 'react';
import { AdminSidebar } from './admin-sidebar';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  userRole: 'directeur' | 'employe';
  username: string;
  onLogout: () => void;
}

export function AdminLayout({ children, userRole, username, onLogout }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar 
        userRole={userRole} 
        username={username} 
        onLogout={onLogout}
      />
      <main className="ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
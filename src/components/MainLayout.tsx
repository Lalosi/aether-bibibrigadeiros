
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

const MainLayout = ({ children, title }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-confectionery-gray/10">
      <Sidebar />
      <div className="flex-1">
        <Header title={title} />
        <main className="p-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

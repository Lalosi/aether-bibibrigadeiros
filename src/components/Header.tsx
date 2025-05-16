
import React from 'react';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';

const Header = ({ title }: { title: string }) => {
  return (
    <header className="flex justify-between items-center py-4 px-8 animate-fade-in">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <SearchBar />
        <UserMenu />
      </div>
    </header>
  );
};

export default Header;

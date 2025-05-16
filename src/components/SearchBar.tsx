
import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = () => {
  return (
    <div className="relative flex items-center w-full max-w-md">
      <Search size={18} className="absolute left-3 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar produtos, clientes, pedidos..."
        className="pl-10 pr-4 py-2 w-full rounded-lg border border-confectionery-purple/20 focus:border-confectionery-purple focus:ring-confectionery-purple/20 focus:ring-2 focus:outline-none transition-all"
      />
    </div>
  );
};

export default SearchBar;

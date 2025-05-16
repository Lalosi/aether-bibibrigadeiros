
import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemProps {
  id: number;
  nome: string;
  preco: string;
  precoUnitario: number;
  quantidade: number;
  imagem: string;
  onRemove: (id: number) => void;
  onUpdateQuantity: (id: number, quantidade: number) => void;
}

const CartItem = ({
  id,
  nome,
  preco,
  precoUnitario,
  quantidade,
  imagem,
  onRemove,
  onUpdateQuantity
}: CartItemProps) => {
  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-0 animate-fade-in">
      <div className="w-16 h-16 rounded-lg overflow-hidden">
        <img src={imagem} alt={nome} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{nome}</h4>
        <p className="text-sm text-primary-foreground font-semibold">{preco}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => quantidade > 1 && onUpdateQuantity(id, quantidade - 1)}
          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          disabled={quantidade <= 1}
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center">{quantidade}</span>
        <button
          onClick={() => onUpdateQuantity(id, quantidade + 1)}
          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default CartItem;

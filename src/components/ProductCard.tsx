
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  id: number;
  nome: string;
  descricao: string;
  preco: string;
  imagem: string;
  disponivel: boolean;
  categoria: string;
  onAddToCart: () => void;
}

const ProductCard = ({ 
  id, 
  nome, 
  descricao, 
  preco, 
  imagem, 
  disponivel, 
  categoria,
  onAddToCart 
}: ProductCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden card-hover animate-scale-in">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imagem} 
          alt={nome} 
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" 
        />
        <div className="absolute top-2 right-2">
          <span className="bg-white/80 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full">
            {categoria}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-lg">{nome}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 h-10">{descricao}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="font-semibold text-primary-foreground">{preco}</span>
          {disponivel ? (
            <Button 
              onClick={onAddToCart}
              size="sm" 
              className="bg-confectionery-pink hover:bg-confectionery-pink/80 text-primary-foreground btn-hover"
            >
              <Plus size={16} className="mr-1" /> Adicionar
            </Button>
          ) : (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
              Indisponível
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

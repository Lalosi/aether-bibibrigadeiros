
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import CartItem from '@/components/CartItem';
import { 
  Search, 
  ChevronDown, 
  ShoppingCart, 
  X, 
  ArrowRight,
  Check
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Dados de exemplo
const categorias = [
  { id: 'todos', nome: 'Todos' },
  { id: 'bolos', nome: 'Bolos' },
  { id: 'tortas', nome: 'Tortas' },
  { id: 'doces', nome: 'Doces' },
  { id: 'cupcakes', nome: 'Cupcakes' },
  { id: 'bebidas', nome: 'Bebidas' },
];

const produtos = [
  {
    id: 1,
    nome: 'Bolo de Chocolate',
    descricao: 'Bolo fofinho de chocolate com cobertura de ganache',
    preco: 'R$ 45,00',
    precoUnitario: 45.0,
    imagem: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=500',
    disponivel: true,
    categoria: 'bolos',
    destaque: true
  },
  {
    id: 2,
    nome: 'Brigadeiros Gourmet',
    descricao: 'Caixa com 12 brigadeiros gourmet em diversos sabores',
    preco: 'R$ 25,00',
    precoUnitario: 25.0,
    imagem: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=500',
    disponivel: true,
    categoria: 'doces',
    destaque: false
  },
  {
    id: 3,
    nome: 'Torta de Morango',
    descricao: 'Torta fresca de morango com creme de baunilha',
    preco: 'R$ 38,00',
    precoUnitario: 38.0,
    imagem: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=500',
    disponivel: true,
    categoria: 'tortas',
    destaque: true
  },
  {
    id: 4,
    nome: 'Cupcake Red Velvet',
    descricao: 'Cupcake red velvet com cobertura de cream cheese',
    preco: 'R$ 8,00',
    precoUnitario: 8.0,
    imagem: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?q=80&w=500',
    disponivel: true,
    categoria: 'cupcakes',
    destaque: false
  },
  {
    id: 5,
    nome: 'Cheesecake de Frutas Vermelhas',
    descricao: 'Cheesecake cremoso com calda de frutas vermelhas',
    preco: 'R$ 42,00',
    precoUnitario: 42.0,
    imagem: 'https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?q=80&w=500',
    disponivel: true,
    categoria: 'tortas',
    destaque: false
  },
  {
    id: 6,
    nome: 'Café Especial',
    descricao: 'Café especial torrado e moído na hora',
    preco: 'R$ 7,50',
    precoUnitario: 7.5,
    imagem: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=500',
    disponivel: true,
    categoria: 'bebidas',
    destaque: false
  }
];

// Tipo para os itens do carrinho
interface CartItem {
  id: number;
  nome: string;
  preco: string;
  precoUnitario: number;
  quantidade: number;
  imagem: string;
}

const OrderPage = () => {
  const { toast } = useToast();
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todos');
  const [busca, setBusca] = useState('');
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);

  // Filtra produtos por categoria e busca
  const produtosFiltrados = produtos.filter(produto => {
    const matchesCategory = categoriaSelecionada === 'todos' || produto.categoria === categoriaSelecionada;
    const matchesSearch = produto.nome.toLowerCase().includes(busca.toLowerCase()) || 
                          produto.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Destacar produtos em destaque
  const produtosDestaque = produtos.filter(produto => produto.destaque);
  
  // Adicionar ao carrinho
  const adicionarAoCarrinho = (produtoId: number) => {
    const produto = produtos.find(p => p.id === produtoId);
    
    if (!produto) return;
    
    const itemExistente = carrinho.find(item => item.id === produtoId);
    
    if (itemExistente) {
      // Se já existe, aumenta a quantidade
      setCarrinho(carrinho.map(item =>
        item.id === produtoId
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      // Se não existe, adiciona novo item
      setCarrinho([
        ...carrinho,
        {
          id: produto.id,
          nome: produto.nome,
          preco: produto.preco,
          precoUnitario: produto.precoUnitario,
          quantidade: 1,
          imagem: produto.imagem
        }
      ]);
    }
    
    toast({
      title: "Produto adicionado",
      description: `${produto.nome} foi adicionado ao carrinho.`,
    });

    // Abre o carrinho automaticamente
    setCarrinhoAberto(true);
  };
  
  // Remover do carrinho
  const removerDoCarrinho = (produtoId: number) => {
    setCarrinho(carrinho.filter(item => item.id !== produtoId));
  };
  
  // Atualizar quantidade
  const atualizarQuantidade = (produtoId: number, novaQuantidade: number) => {
    setCarrinho(carrinho.map(item =>
      item.id === produtoId
        ? { ...item, quantidade: novaQuantidade }
        : item
    ));
  };
  
  // Calcular total do carrinho
  const totalCarrinho = carrinho.reduce(
    (total, item) => total + item.precoUnitario * item.quantidade,
    0
  );
  
  // Toggle do carrinho
  const toggleCarrinho = () => {
    setCarrinhoAberto(!carrinhoAberto);
  };

  // Fechar carrinho ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#cart-sidebar') && !target.closest('#cart-toggle')) {
        setCarrinhoAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Finalizar pedido
  const finalizarPedido = () => {
    if (carrinho.length === 0) return;
    
    toast({
      title: "Pedido finalizado!",
      description: "Seu pedido foi registrado com sucesso.",
      action: (
        <Button variant="outline" size="sm">
          <Check className="h-4 w-4" /> Ok
        </Button>
      ),
    });
    
    setCarrinho([]);
    setCarrinhoAberto(false);
  };

  return (
    <div className="min-h-screen bg-confectionery-gray/10">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 md:px-10 sticky top-0 z-10 glass-effect">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Logo size="small" />
            <nav className="hidden md:flex space-x-6">
              {categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  onClick={() => setCategoriaSelecionada(categoria.id)}
                  className={`text-sm font-medium animate-hover ${
                    categoriaSelecionada === categoria.id
                      ? 'text-primary-foreground'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {categoria.nome}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar produtos..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <button
              id="cart-toggle"
              onClick={toggleCarrinho}
              className="relative p-2 rounded-full bg-confectionery-pink/20 hover:bg-confectionery-pink/40 transition-colors"
            >
              <ShoppingCart size={20} />
              {carrinho.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {carrinho.length}
                </span>
              )}
            </button>
            
            <div className="flex md:hidden">
              <button className="p-2">
                <ChevronDown />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Busca Mobile */}
      <div className="md:hidden p-4 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar produtos..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      {/* Categorias Mobile */}
      <div className="md:hidden p-4 overflow-x-auto whitespace-nowrap">
        {categorias.map((categoria) => (
          <button
            key={categoria.id}
            onClick={() => setCategoriaSelecionada(categoria.id)}
            className={`mr-3 px-4 py-2 rounded-full text-sm ${
              categoriaSelecionada === categoria.id
                ? 'bg-confectionery-pink text-primary-foreground'
                : 'bg-white border border-gray-200'
            }`}
          >
            {categoria.nome}
          </button>
        ))}
      </div>
      
      <main className="max-w-7xl mx-auto p-6">
        {/* Banner/Destaques */}
        <section className="mb-10">
          <h2 className="text-2xl font-medium mb-4">Destaques</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {produtosDestaque.map((produto) => (
              <ProductCard
                key={produto.id}
                id={produto.id}
                nome={produto.nome}
                descricao={produto.descricao}
                preco={produto.preco}
                imagem={produto.imagem}
                disponivel={produto.disponivel}
                categoria={categorias.find(cat => cat.id === produto.categoria)?.nome || ''}
                onAddToCart={() => adicionarAoCarrinho(produto.id)}
              />
            ))}
          </div>
        </section>
        
        {/* Lista de Produtos */}
        <section>
          <h2 className="text-2xl font-medium mb-4">Nossos Produtos</h2>
          
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Nenhum produto encontrado.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setBusca('');
                  setCategoriaSelecionada('todos');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {produtosFiltrados.map((produto) => (
                <ProductCard
                  key={produto.id}
                  id={produto.id}
                  nome={produto.nome}
                  descricao={produto.descricao}
                  preco={produto.preco}
                  imagem={produto.imagem}
                  disponivel={produto.disponivel}
                  categoria={categorias.find(cat => cat.id === produto.categoria)?.nome || ''}
                  onAddToCart={() => adicionarAoCarrinho(produto.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      
      {/* Carrinho Lateral */}
      <div 
        id="cart-sidebar"
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-lg transform transition-transform duration-300 z-20 ${
          carrinhoAberto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-medium">Seu Carrinho</h3>
            <button onClick={() => setCarrinhoAberto(false)} className="p-2">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {carrinho.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart size={40} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Seu carrinho está vazio</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setCarrinhoAberto(false)}
                >
                  Continuar Comprando
                </Button>
              </div>
            ) : (
              <>
                {carrinho.map((item) => (
                  <CartItem
                    key={item.id}
                    id={item.id}
                    nome={item.nome}
                    preco={`R$ ${(item.precoUnitario * item.quantidade).toFixed(2).replace('.', ',')}`}
                    precoUnitario={item.precoUnitario}
                    quantidade={item.quantidade}
                    imagem={item.imagem}
                    onRemove={removerDoCarrinho}
                    onUpdateQuantity={atualizarQuantidade}
                  />
                ))}
              </>
            )}
          </div>
          
          {carrinho.length > 0 && (
            <div className="border-t p-4">
              <div className="flex justify-between mb-4">
                <span className="font-medium">Subtotal</span>
                <span className="font-medium">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
              </div>
              <Button 
                className="w-full bg-confectionery-pink hover:bg-confectionery-pink/80 text-primary-foreground btn-hover"
                onClick={finalizarPedido}
              >
                Finalizar Pedido <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => setCarrinhoAberto(false)}
              >
                Continuar Comprando
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Overlay para o carrinho */}
      {carrinhoAberto && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10"
          onClick={() => setCarrinhoAberto(false)}
        />
      )}
      
      {/* Footer */}
      <footer className="bg-white border-t py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Logo size="small" />
          <p className="text-sm text-gray-500 mt-4">
            © 2023 AETHER Confeitaria. Todos os direitos reservados.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link to="/" className="text-sm text-gray-500 hover:text-primary-foreground animate-hover">
              Início
            </Link>
            <Link to="/sobre" className="text-sm text-gray-500 hover:text-primary-foreground animate-hover">
              Sobre
            </Link>
            <Link to="/contato" className="text-sm text-gray-500 hover:text-primary-foreground animate-hover">
              Contato
            </Link>
            <Link to="/termos" className="text-sm text-gray-500 hover:text-primary-foreground animate-hover">
              Termos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OrderPage;

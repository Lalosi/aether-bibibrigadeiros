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
  Check,
  FilterIcon,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCardapio } from '@/hooks/useCardapio';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';

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
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    categorias: categoriasCardapio,
    itens: produtos,
    sabores,
    isLoading,
    error,
    refetch,
  } = useCardapio();
  const categorias = [{ id: 'todos', nome: 'Todos' }, ...categoriasCardapio];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todos');
  const [busca, setBusca] = useState('');
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const categoriaBrigadeiros = categorias.find((c) => c.nome.toLowerCase() === 'brigadeiros')?.id;

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

  // Toggle filtro mobile
  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
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

  // Finalizar pedido — grava em `pedidos` via função do banco (criar_pedido_loja)
  const finalizarPedido = async () => {
    if (carrinho.length === 0 || finalizando) return;

    setFinalizando(true);
    const p_itens = carrinho.map((it) => ({
      cardapio_item_id: it.id,
      quantidade: it.quantidade,
    }));
    const { data, error } = await supabase.rpc('criar_pedido_loja', { p_itens });
    setFinalizando(false);

    if (error) {
      toast({
        title: 'Não foi possível finalizar o pedido',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Pedido realizado!',
      description: `Seu pedido #${data} foi registrado com sucesso.`,
      action: (
        <Button variant="outline" size="sm">
          <Check className="h-4 w-4" /> Ok
        </Button>
      ),
    });

    setCarrinho([]);
    setCarrinhoAberto(false);
    refetch();
  };

  return (
    <div className="min-h-screen bg-confectionery-gray/10">
      {/* Header */}
      <header className="bg-white shadow-sm py-3 px-4 md:py-4 md:px-6 lg:px-10 sticky top-0 z-10 glass-effect">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-8">
            <Logo size="small" />
            <nav className="hidden md:flex space-x-4 lg:space-x-6">
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
          
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative hidden md:block w-48 lg:w-64">
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
              aria-label="Abrir carrinho"
            >
              <ShoppingCart size={20} />
              {carrinho.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {carrinho.length}
                </span>
              )}
            </button>
            
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition-colors"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={20} />
            </button>

            <button
              className="flex md:hidden p-2"
              onClick={toggleFilters}
              aria-label="Filtros"
            >
              <FilterIcon size={20} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile Filter Sheet */}
      {isMobile && (
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetContent side="left" className="w-[80%] max-w-sm">
            <div className="py-4">
              <h3 className="text-lg font-medium mb-4">Filtros</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="mobile-search" className="text-sm font-medium block mb-2">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="mobile-search"
                      placeholder="Buscar produtos..." 
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Categorias</p>
                  <div className="space-y-2">
                    {categorias.map((categoria) => (
                      <button
                        key={categoria.id}
                        onClick={() => {
                          setCategoriaSelecionada(categoria.id);
                          setFiltersOpen(false);
                        }}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                          categoriaSelecionada === categoria.id
                            ? 'bg-confectionery-pink text-primary-foreground'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {categoria.nome}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
      
      {/* Categorias Mobile Horizontal */}
      <div className="md:hidden p-3 overflow-x-auto whitespace-nowrap">
        {categorias.map((categoria) => (
          <button
            key={categoria.id}
            onClick={() => setCategoriaSelecionada(categoria.id)}
            className={`mr-2 px-3 py-1.5 rounded-full text-xs ${
              categoriaSelecionada === categoria.id
                ? 'bg-confectionery-pink text-primary-foreground'
                : 'bg-white border border-gray-200'
            }`}
          >
            {categoria.nome}
          </button>
        ))}
      </div>
      
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Banner/Destaques (só aparece quando há itens marcados como destaque) */}
        {produtosDestaque.length > 0 && (
        <section className="mb-6 md:mb-10">
          <h2 className="text-xl md:text-2xl font-medium mb-3 md:mb-4">Destaques</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
        )}

        {/* Sabores de brigadeiro */}
        {sabores.length > 0 &&
          (categoriaSelecionada === 'todos' || categoriaSelecionada === categoriaBrigadeiros) && (
            <section className="mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-medium mb-2">Sabores de brigadeiro</h2>
              <div className="flex flex-wrap gap-2">
                {sabores.map((sabor) => (
                  <span
                    key={sabor}
                    className="px-3 py-1 rounded-full bg-confectionery-pink/30 text-sm"
                  >
                    {sabor}
                  </span>
                ))}
              </div>
            </section>
          )}

        {/* Lista de Produtos */}
        <section>
          <h2 className="text-xl md:text-2xl font-medium mb-3 md:mb-4">Nossos Produtos</h2>
          
          {isLoading ? (
            <div className="text-center py-6 md:py-10">
              <p className="text-gray-500">Carregando cardápio...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6 md:py-10">
              <p className="text-gray-500">Não foi possível carregar o cardápio.</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="text-center py-6 md:py-10">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
      
      {/* Carrinho */}
      {isMobile ? (
        <Sheet open={carrinhoAberto} onOpenChange={setCarrinhoAberto}>
          <SheetContent className="w-[90%] max-w-md p-0">
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
                    disabled={finalizando}
                  >
                    {finalizando ? 'Finalizando...' : <>Finalizar Pedido <ArrowRight size={16} className="ml-2" /></>}
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
          </SheetContent>
        </Sheet>
      ) : (
        <>
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
                    disabled={finalizando}
                  >
                    {finalizando ? 'Finalizando...' : <>Finalizar Pedido <ArrowRight size={16} className="ml-2" /></>}
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
        </>
      )}
      
      {/* Footer */}
      <footer className="bg-white border-t py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <Logo size="small" />
          <p className="text-xs md:text-sm text-gray-500 mt-3 md:mt-4">
            © 2023 AETHER Confeitaria. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-3 md:mt-4">
            <Link to="/" className="text-xs md:text-sm text-gray-500 hover:text-primary-foreground animate-hover">
              Início
            </Link>
            <Link to="/sobre" className="text-xs md:text-sm text-gray-500 hover:text-primary-foreground animate-hover">
              Sobre
            </Link>
            <Link to="/contato" className="text-xs md:text-sm text-gray-500 hover:text-primary-foreground animate-hover">
              Contato
            </Link>
            <Link to="/termos" className="text-xs md:text-sm text-gray-500 hover:text-primary-foreground animate-hover">
              Termos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OrderPage;


import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Calendar } from 'lucide-react';

// Produtos exemplo
const productCategories = [
  {
    name: 'Bolos',
    items: [
      { id: 1, name: 'Bolo de Chocolate', price: 89.90, image: 'https://picsum.photos/id/175/300/300' },
      { id: 2, name: 'Bolo Red Velvet', price: 95.90, image: 'https://picsum.photos/id/292/300/300' },
      { id: 3, name: 'Bolo de Cenoura', price: 75.00, image: 'https://picsum.photos/id/146/300/300' },
    ]
  },
  {
    name: 'Doces',
    items: [
      { id: 4, name: 'Caixa de Brigadeiros', price: 45.00, image: 'https://picsum.photos/id/125/300/300' },
      { id: 5, name: 'Caixa de Trufas', price: 55.00, image: 'https://picsum.photos/id/960/300/300' },
      { id: 6, name: 'Bombons Sortidos', price: 65.00, image: 'https://picsum.photos/id/431/300/300' },
    ]
  },
  {
    name: 'Tortas',
    items: [
      { id: 7, name: 'Torta de Limão', price: 75.00, image: 'https://picsum.photos/id/221/300/300' },
      { id: 8, name: 'Torta de Morango', price: 80.00, image: 'https://picsum.photos/id/324/300/300' },
      { id: 9, name: 'Cheesecake', price: 85.00, image: 'https://picsum.photos/id/291/300/300' },
    ]
  }
];

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const OrderPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState('catalogo');
  
  const { toast } = useToast();

  const addToCart = (product: {id: number, name: string, price: number, image: string}) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });

    toast({
      title: 'Produto adicionado',
      description: `${product.name} foi adicionado ao seu carrinho.`,
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    
    setCart(prevCart => prevCart.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione produtos ao carrinho antes de finalizar o pedido.',
        variant: 'destructive',
      });
      return;
    }

    if (!name || !email || !phone || !deliveryDate || !address || !paymentMethod) {
      toast({
        title: 'Informações incompletas',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    // Simular envio do pedido
    toast({
      title: 'Pedido enviado com sucesso!',
      description: 'Em breve entraremos em contato para confirmar seu pedido.',
    });
    
    // Limpar formulário e carrinho
    setName('');
    setEmail('');
    setPhone('');
    setDeliveryDate('');
    setAddress('');
    setNotes('');
    setPaymentMethod('');
    setCart([]);
    setActiveTab('catalogo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-confectionery-pink/20 to-white">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo />
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-primary-foreground animate-hover">Início</a>
            <a href="#" className="text-gray-600 hover:text-primary-foreground animate-hover">Produtos</a>
            <a href="#" className="text-gray-600 hover:text-primary-foreground animate-hover">Sobre</a>
            <a href="#" className="text-gray-600 hover:text-primary-foreground animate-hover">Contato</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-confectionery-pink hover:bg-confectionery-pink/80">Cadastrar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Faça seu Pedido</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Nossos produtos são feitos com ingredientes selecionados e muito carinho. Faça seu pedido online e receba no conforto da sua casa.</p>
        </div>

        <Tabs defaultValue="catalogo" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger 
              value="catalogo" 
              onClick={() => setActiveTab('catalogo')}
              className={activeTab === 'catalogo' ? 'bg-confectionery-pink text-primary-foreground' : ''}
            >
              Catálogo
            </TabsTrigger>
            <TabsTrigger 
              value="carrinho" 
              onClick={() => setActiveTab('carrinho')}
              className={activeTab === 'carrinho' ? 'bg-confectionery-pink text-primary-foreground' : ''}
            >
              Carrinho ({cart.length})
            </TabsTrigger>
            <TabsTrigger 
              value="checkout" 
              onClick={() => setActiveTab('checkout')}
              className={activeTab === 'checkout' ? 'bg-confectionery-pink text-primary-foreground' : ''}
            >
              Checkout
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalogo">
            {productCategories.map((category, index) => (
              <div key={index} className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 gradient-text inline-block">{category.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((product) => (
                    <Card key={product.id} className="overflow-hidden card-hover">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-48 object-cover"
                      />
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-lg">{product.name}</h3>
                          <span className="font-semibold">R$ {product.price.toFixed(2)}</span>
                        </div>
                        <Button 
                          onClick={() => addToCart(product)} 
                          className="w-full mt-2 bg-confectionery-pink hover:bg-confectionery-pink/80"
                        >
                          Adicionar ao Carrinho
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="carrinho">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-confectionery-pink/10 p-8 rounded-xl inline-block mb-4">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="21" r="1"></circle>
                    <circle cx="19" cy="21" r="1"></circle>
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-2">Seu carrinho está vazio</h2>
                <p className="text-gray-500 mb-6">Adicione alguns produtos deliciosos para continuar</p>
                <Button 
                  onClick={() => setActiveTab('catalogo')} 
                  className="bg-confectionery-pink hover:bg-confectionery-pink/80"
                >
                  Voltar ao Catálogo
                </Button>
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-confectionery-pink/10">
                      <tr>
                        <th className="text-left py-4 px-6 font-medium text-gray-600">Produto</th>
                        <th className="text-center py-4 px-6 font-medium text-gray-600">Quantidade</th>
                        <th className="text-right py-4 px-6 font-medium text-gray-600">Valor</th>
                        <th className="text-right py-4 px-6 font-medium text-gray-600">Subtotal</th>
                        <th className="py-4 px-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(item => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-confectionery-pink/5 animate-hover">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-8 w-8 rounded-full"
                              >
                                -
                              </Button>
                              <span className="w-10 text-center">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 rounded-full"
                              >
                                +
                              </Button>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">R$ {item.price.toFixed(2)}</td>
                          <td className="py-4 px-6 text-right font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</td>
                          <td className="py-4 px-6 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeFromCart(item.id)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              Remover
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-confectionery-pink/5">
                      <tr>
                        <td colSpan={3} className="py-4 px-6 text-right font-semibold">Total:</td>
                        <td className="py-4 px-6 text-right font-bold text-lg">R$ {calculateTotal().toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('catalogo')}
                  >
                    Continuar Comprando
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('checkout')}
                    className="bg-confectionery-pink hover:bg-confectionery-pink/80"
                  >
                    Finalizar Pedido
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="checkout">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold mb-6">Informações de Contato</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">Nome Completo *</label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Digite seu nome completo"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">Email *</label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Digite seu email"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium mb-1">Telefone *</label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <label htmlFor="deliveryDate" className="block text-sm font-medium mb-1">Data de Entrega *</label>
                        <div className="relative">
                          <Input
                            id="deliveryDate"
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium mb-1">Endereço de Entrega *</label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Rua, número, complemento, bairro, cidade, estado"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium mb-1">Observações</label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Instruções especiais, alergias, etc."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-6">Forma de Pagamento *</h2>
                  
                  <div className="space-y-4">
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit">Cartão de Débito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cash">Dinheiro na Entrega</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {paymentMethod === 'credit' || paymentMethod === 'debit' ? (
                      <div className="p-4 rounded-lg border border-confectionery-pink/20 bg-confectionery-pink/5">
                        <p className="text-sm text-gray-600 mb-4">Os dados do cartão serão solicitados pelo nosso processador de pagamentos após a confirmação do pedido.</p>
                      </div>
                    ) : paymentMethod === 'pix' ? (
                      <div className="p-4 rounded-lg border border-confectionery-pink/20 bg-confectionery-pink/5">
                        <p className="text-sm text-gray-600 mb-4">Um QR code PIX será gerado após a confirmação do pedido.</p>
                      </div>
                    ) : paymentMethod === 'cash' ? (
                      <div className="p-4 rounded-lg border border-confectionery-pink/20 bg-confectionery-pink/5">
                        <p className="text-sm text-gray-600 mb-4">Por favor, tenha o valor exato para facilitar a entrega.</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
                  <h2 className="text-lg font-semibold mb-6">Resumo do Pedido</h2>
                  
                  <div className="space-y-4 mb-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 inline-flex items-center justify-center bg-confectionery-pink/20 rounded-full text-xs">
                            {item.quantity}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span>R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Taxa de entrega</span>
                      <span>Grátis</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-lg pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSubmitOrder} 
                    className="w-full mt-6 bg-confectionery-pink hover:bg-confectionery-pink/80"
                    disabled={cart.length === 0}
                  >
                    Finalizar Pedido
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center mt-4">
                    Ao finalizar o pedido você concorda com nossos Termos de Serviço e Política de Privacidade
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Logo />
              <p className="text-gray-500 mt-4">Delícias artesanais feitas com amor e os melhores ingredientes.</p>
            </div>
            <div>
              <h3 className="font-medium mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-500 hover:text-primary-foreground animate-hover">Início</a></li>
                <li><a href="#" className="text-gray-500 hover:text-primary-foreground animate-hover">Catálogo</a></li>
                <li><a href="#" className="text-gray-500 hover:text-primary-foreground animate-hover">Sobre Nós</a></li>
                <li><a href="#" className="text-gray-500 hover:text-primary-foreground animate-hover">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Contato</h3>
              <ul className="space-y-2 text-gray-500">
                <li>Rua das Flores, 123</li>
                <li>São Paulo, SP</li>
                <li>contato@aether.com</li>
                <li>(11) 99999-9999</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Horário</h3>
              <ul className="space-y-2 text-gray-500">
                <li>Segunda a Sexta: 9h às 18h</li>
                <li>Sábado: 9h às 14h</li>
                <li>Domingo: Fechado</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2025 AETHER. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OrderPage;

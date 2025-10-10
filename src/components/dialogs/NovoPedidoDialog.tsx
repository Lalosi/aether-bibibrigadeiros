import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Database, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const pedidoSchema = z.object({
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  itens: z.string().min(1, 'Quantidade de itens é obrigatória'),
  total: z.string().min(1, 'Valor total é obrigatório'),
  pagamento: z.string().min(1, 'Forma de pagamento é obrigatória'),
  status: z.string().min(1, 'Status é obrigatório'),
});

type PedidoFormData = z.infer<typeof pedidoSchema>;

interface NovoPedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (pedido: any) => void;
}

export const NovoPedidoDialog = ({ open, onOpenChange, onSuccess }: NovoPedidoDialogProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<PedidoFormData>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: {
      cliente: '',
      itens: '',
      total: '',
      pagamento: 'Cartão',
      status: 'Aguardando Pagamento',
    },
  });

  const onSubmit = async (data: PedidoFormData) => {
    setIsSubmitting(true);

    // Simular delay de inserção no banco
    await new Promise(resolve => setTimeout(resolve, 1500));

    const novoPedido = {
      id: `#PED${String(Date.now()).slice(-3)}`,
      cliente: data.cliente,
      data: new Date().toLocaleDateString('pt-BR'),
      itens: parseInt(data.itens),
      total: data.total,
      pagamento: data.pagamento,
      status: data.status,
    };

    // SQL simulado
    const sqlCommand = `INSERT INTO Pedido (cod_pedido, cliente, data, itens, valor_total, pagamento, status) 
VALUES ('${novoPedido.id}', '${data.cliente}', '${novoPedido.data}', ${data.itens}, '${data.total}', '${data.pagamento}', '${data.status}')`;

    toast({
      title: "✅ Pedido criado com sucesso!",
      description: (
        <div className="mt-2 space-y-2">
          <p className="text-sm">O registro foi inserido no banco de dados.</p>
          <div className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
            {sqlCommand}
          </div>
          <p className="text-xs text-muted-foreground">
            🖋️ Novo registro inserido na tabela Pedido às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
      ),
      duration: 5000,
    });

    onSuccess(novoPedido);
    form.reset();
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-confectionery-pink" />
            Novo Pedido
          </DialogTitle>
          <DialogDescription>
            🧩 Ao clicar em Salvar, o sistema executará uma operação de INSERT no banco de dados, 
            adicionando este registro à tabela <code className="bg-muted px-1 rounded">Pedido</code>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Maria Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="itens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Itens</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total</FormLabel>
                    <FormControl>
                      <Input placeholder="R$ 180,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option value="Cartão">Cartão</option>
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option value="Aguardando Pagamento">Aguardando Pagamento</option>
                      <option value="Confirmado">Confirmado</option>
                      <option value="Em Preparo">Em Preparo</option>
                      <option value="Em Entrega">Em Entrega</option>
                      <option value="Entregue">Entregue</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-confectionery-pink hover:bg-confectionery-pink/80"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

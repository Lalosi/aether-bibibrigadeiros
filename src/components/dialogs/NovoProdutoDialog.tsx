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

const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  preco: z.string().min(1, 'Preço é obrigatório'),
  estoque: z.string().min(1, 'Quantidade é obrigatória'),
  fornecedor: z.string().min(1, 'Fornecedor é obrigatório').max(100),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface NovoProdutoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (produto: any) => void;
}

export const NovoProdutoDialog = ({ open, onOpenChange, onSuccess }: NovoProdutoDialogProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      categoria: '',
      preco: '',
      estoque: '',
      fornecedor: '',
    },
  });

  const onSubmit = async (data: ProdutoFormData) => {
    setIsSubmitting(true);

    // Simular delay de inserção no banco
    await new Promise(resolve => setTimeout(resolve, 1500));

    const novoProduto = {
      id: Date.now(),
      nome: data.nome,
      categoria: data.categoria,
      preco: data.preco,
      estoque: parseInt(data.estoque),
      status: parseInt(data.estoque) > 10 ? 'Disponível' : parseInt(data.estoque) > 0 ? 'Baixo' : 'Indisponível',
      fornecedor: data.fornecedor,
    };

    // SQL simulado
    const sqlCommand = `INSERT INTO Produto (nome, categoria, preco, estoque, fornecedor) 
VALUES ('${data.nome}', '${data.categoria}', '${data.preco}', ${data.estoque}, '${data.fornecedor}')`;

    toast({
      title: "✅ Produto adicionado com sucesso!",
      description: (
        <div className="mt-2 space-y-2">
          <p className="text-sm">O registro foi inserido no banco de dados.</p>
          <div className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
            {sqlCommand}
          </div>
          <p className="text-xs text-muted-foreground">
            🖋️ Novo registro inserido na tabela Produto às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
      ),
      duration: 5000,
    });

    onSuccess(novoProduto);
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
            Novo Produto
          </DialogTitle>
          <DialogDescription>
            🧩 Ao clicar em Salvar, o sistema executará uma operação de INSERT no banco de dados, 
            adicionando este registro à tabela <code className="bg-muted px-1 rounded">Produto</code>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Bolo de Chocolate" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Bolos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <FormControl>
                      <Input placeholder="R$ 40,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estoque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fornecedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Distribuidora ABC" {...field} />
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

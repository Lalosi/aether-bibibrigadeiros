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

const clienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  cpf: z.string().min(11, 'CPF inválido').max(14),
  telefone: z.string().min(10, 'Telefone inválido').max(15),
  endereco: z.string().min(1, 'Endereço é obrigatório').max(200),
  email: z.string().email('E-mail inválido'),
  tipo: z.enum(['Pessoa Física', 'Pessoa Jurídica']),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface NovoClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (cliente: any) => void;
}

export const NovoClienteDialog = ({ open, onOpenChange, onSuccess }: NovoClienteDialogProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      telefone: '',
      endereco: '',
      email: '',
      tipo: 'Pessoa Física',
    },
  });

  const onSubmit = async (data: ClienteFormData) => {
    setIsSubmitting(true);

    // Simular delay de inserção no banco
    await new Promise(resolve => setTimeout(resolve, 1500));

    const novoCliente = {
      id: Date.now(),
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      endereco: data.endereco,
      ultimaCompra: new Date().toLocaleDateString('pt-BR'),
      totalGasto: 'R$ 0,00',
      status: 'Ativo',
      tipo: data.tipo,
    };

    // SQL simulado
    const sqlCommand = `INSERT INTO Cliente (nome, cpf, telefone, endereco, email, tipo) 
VALUES ('${data.nome}', '${data.cpf}', '${data.telefone}', '${data.endereco}', '${data.email}', '${data.tipo}')`;

    toast({
      title: "✅ Cliente adicionado com sucesso!",
      description: (
        <div className="mt-2 space-y-2">
          <p className="text-sm">O registro foi inserido no banco de dados.</p>
          <div className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
            {sqlCommand}
          </div>
          <p className="text-xs text-muted-foreground">
            🖋️ Novo registro inserido na tabela Cliente às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
      ),
      duration: 5000,
    });

    onSuccess(novoCliente);
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
            Novo Cliente
          </DialogTitle>
          <DialogDescription>
            🧩 Ao clicar em Salvar, o sistema executará uma operação de INSERT no banco de dados, 
            adicionando este registro à tabela <code className="bg-muted px-1 rounded">Cliente</code>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Maria Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option value="Pessoa Física">Pessoa Física</option>
                      <option value="Pessoa Jurídica">Pessoa Jurídica</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 98765-4321" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="cliente@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua das Flores, 123" {...field} />
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

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Boxes } from 'lucide-react';

interface ObjectPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  className: string;
  data: Record<string, any> | null;
  description?: string;
}

const formatValue = (v: any): string => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (v instanceof Date) return v.toLocaleString('pt-BR');
  return String(v);
};

export const ObjectPopup = ({
  open,
  onOpenChange,
  title,
  className,
  data,
  description,
}: ObjectPopupProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Boxes className="h-5 w-5 text-confectionery-pink" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description ?? 'Representação do objeto persistido.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-confectionery-pink/30 bg-confectionery-pink/5 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Instância
            </div>
            <div className="font-semibold text-base mb-3">{className}</div>

            <div className="divide-y divide-confectionery-pink/10">
              {data
                ? Object.entries(data).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 py-2 text-sm">
                      <span className="font-medium text-muted-foreground">{key}</span>
                      <span className="text-right break-all">{formatValue(value)}</span>
                    </div>
                  ))
                : (
                  <div className="py-2 text-sm text-muted-foreground">Sem dados.</div>
                )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-confectionery-pink hover:bg-confectionery-pink/80"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

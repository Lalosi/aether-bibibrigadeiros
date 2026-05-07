import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Boxes, Braces } from 'lucide-react';

interface ObjectPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  className: string;
  data: Record<string, any> | null;
  description?: string;
}

const formatValue = (v: any): { text: string; tone: string } => {
  if (v === null || v === undefined || v === '') return { text: 'null', tone: 'text-muted-foreground italic' };
  if (typeof v === 'number') return { text: String(v), tone: 'text-amber-600 dark:text-amber-400' };
  if (typeof v === 'boolean') return { text: String(v), tone: 'text-purple-600 dark:text-purple-400' };
  if (v instanceof Date) return { text: `"${v.toLocaleString('pt-BR')}"`, tone: 'text-emerald-600 dark:text-emerald-400' };
  return { text: `"${String(v)}"`, tone: 'text-emerald-600 dark:text-emerald-400' };
};

const guessInstanceName = (data: Record<string, any> | null) =>
  data?.nome ?? data?.cliente ?? data?.id ?? '—';

export const ObjectPopup = ({
  open,
  onOpenChange,
  title,
  className,
  data,
  description,
}: ObjectPopupProps) => {
  const instanceName = guessInstanceName(data);
  const entries = data ? Object.entries(data) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-confectionery-pink/20 via-confectionery-pink/10 to-transparent px-6 pt-6 pb-4 border-b border-confectionery-pink/20">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Boxes className="h-5 w-5 text-confectionery-pink" />
            <span className="text-muted-foreground font-normal">Classe:</span>
            <span className="font-bold">{className}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-50 font-semibold tracking-wide">
              Instância
            </span>
            <span className="font-mono text-sm truncate text-slate-800">{instanceName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-3">
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}

          <div className="rounded-lg border border-confectionery-pink/30 bg-slate-950 text-slate-100 font-mono text-xs overflow-hidden shadow-inner">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-400">
                <Braces className="h-3.5 w-3.5" />
                <span>{className}.toJSON()</span>
              </div>
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500/70" />
                <span className="h-2 w-2 rounded-full bg-yellow-500/70" />
                <span className="h-2 w-2 rounded-full bg-green-500/70" />
              </div>
            </div>
            <pre className="px-4 py-3 overflow-x-auto leading-relaxed">
              <span className="text-slate-500">{`{`}</span>
              {entries.length === 0 && (
                <div className="pl-4 text-slate-500">// sem dados</div>
              )}
              {entries.map(([key, value], idx) => {
                const { text, tone } = formatValue(value);
                return (
                  <div key={key} className="pl-4">
                    <span className="text-sky-300">"{key}"</span>
                    <span className="text-slate-400">: </span>
                    <span className={tone}>{text}</span>
                    {idx < entries.length - 1 && <span className="text-slate-500">,</span>}
                  </div>
                );
              })}
              <span className="text-slate-500">{`}`}</span>
            </pre>
          </div>

          <div className="flex justify-end pt-2">
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

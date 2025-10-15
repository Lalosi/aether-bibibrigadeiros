import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Database, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SQLPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sqlCommand: string;
}

export const SQLPopup = ({ open, onOpenChange, title, sqlCommand }: SQLPopupProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-confectionery-pink" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este é o comando SQL que seria executado no banco de dados:
          </p>
          
          <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre className="whitespace-pre-wrap break-words">{sqlCommand}</pre>
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

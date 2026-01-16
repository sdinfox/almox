import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
  width?: string;
  height?: string;
  className?: string;
}

export interface SignaturePadRef {
  clear: () => void;
  isEmpty: () => boolean;
  getTrimmedCanvas: () => HTMLCanvasElement | null;
  toDataURL: () => string;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ width = '100%', height = '200px', className }, ref) => {
    const sigCanvas = useRef<SignatureCanvas | null>(null);
    const [isSigned, setIsSigned] = useState(false);

    useImperativeHandle(ref, () => ({
      clear: () => {
        sigCanvas.current?.clear();
        setIsSigned(false);
      },
      isEmpty: () => sigCanvas.current?.isEmpty() ?? true,
      getTrimmedCanvas: () => {
        if (sigCanvas.current) {
          return sigCanvas.current.getTrimmedCanvas();
        }
        return null;
      },
      toDataURL: () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
          return sigCanvas.current.toDataURL('image/png');
        }
        return '';
      }
    }));

    const handleEnd = () => {
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        setIsSigned(true);
      }
    };

    return (
      <div className={cn("border rounded-lg p-2 bg-white dark:bg-gray-900", className)}>
        <div className="relative" style={{ width, height }}>
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{ 
              width: 500, 
              height: 200, 
              className: 'sigCanvas w-full h-full border border-dashed rounded-md' 
            }}
            onEnd={handleEnd}
          />
          {!isSigned && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/70">
              Assine aqui
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-muted-foreground">Assinatura do Solicitante</p>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => ref && (ref as React.MutableRefObject<SignaturePadRef>).current.clear()}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
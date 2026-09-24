import { ReactNode } from 'react';
import { CircleCheck, X } from 'lucide-react';

export interface SuccessModalDetail {
  label: string;
  value: ReactNode;
  separator?: boolean;
  mono?: boolean;
  bold?: boolean;
}

interface SuccessModalProps {
  title: string;
  description?: string;
  details: SuccessModalDetail[];
  onClose: () => void;
}

export default function SuccessModal({ title, description, details, onClose }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[50000] p-4">
      <div className="bg-card text-foreground rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-olive/10 flex items-center justify-center">
            <CircleCheck className="w-6 h-6 text-olive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>

        <div className="mt-5 bg-muted/50 border border-border rounded-lg p-4 space-y-2 text-sm">
          {details.map((detail, i) => (
            <div
              key={i}
              className={`flex justify-between ${detail.separator ? 'pt-2 border-t border-border' : ''}`}
            >
              <span className="text-muted-foreground">{detail.label}</span>
              <span className={`${detail.mono ? 'font-mono ' : ''}${detail.bold ? 'font-semibold' : 'font-medium'}`}>
                {detail.value}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 bg-olive text-white rounded-lg font-semibold hover:bg-olive/90 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

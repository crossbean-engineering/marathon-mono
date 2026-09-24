import { Lock } from 'lucide-react';
import {
  PACKAGE_SALES_CLOSED_MESSAGE,
  PACKAGE_SALES_CLOSED_TITLE,
} from '../lib/registration-status';

export function RegistrationClosedNotice({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center text-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 ${
        compact ? 'p-6' : 'p-8 sm:p-12'
      }`}
    >
      <div className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} bg-muted rounded-full flex items-center justify-center`}>
        <Lock className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-muted-foreground`} />
      </div>
      <div>
        <h3 className={`font-display font-bold ${compact ? 'text-base' : 'text-xl'} mb-1`}>
          {PACKAGE_SALES_CLOSED_TITLE}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">{PACKAGE_SALES_CLOSED_MESSAGE}</p>
      </div>
    </div>
  );
}

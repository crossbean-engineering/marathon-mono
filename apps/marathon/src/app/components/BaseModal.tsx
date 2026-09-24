import { ReactNode, useState } from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
  trigger: ReactNode; // The button or element that opens the modal
  title: string;
  description?: string;
  children: (closeModal: () => void) => ReactNode; // Children get closeModal function
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function BaseModal({ 
  trigger, 
  title, 
  description, 
  children, 
  maxWidth = 'md' 
}: BaseModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {/* Trigger button/element */}
      <div onClick={openModal}>
        {trigger}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-500000 p-4">
          <div className={`bg-card text-foreground rounded-2xl p-4 ${maxWidthClasses[maxWidth]} w-full shadow-2xl border border-border relative`}>
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-display font-semibold text-foreground mb-2">
                {title}
              </h3>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>

            {/* Content */}
            <div>
              {children(closeModal)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
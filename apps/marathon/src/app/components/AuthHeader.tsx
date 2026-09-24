import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeLogo from './ThemeLogo';
import { LogOut, ChevronDown } from 'lucide-react';

type Props =  {
title?: string
}

const roleLabel: Record<string, string> = {
  user: 'Participant',
  agent: 'Agent',
  admin: 'Admin',
};

export function AuthHeader({title}: Props) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?';

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <ThemeLogo />
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-display font-semibold leading-tight truncate">
              {title ?? `${roleLabel[user?.role ?? ''] ?? ''} Portal`}
            </p>
          </div>
        </div>

        {/* User menu */}
        {isAuthenticated && user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full border border-border bg-background pl-1 pr-2 py-1 hover:bg-muted transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-olive text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                {initials}
              </span>
              <span className="text-sm font-medium max-w-28 sm:max-w-40 truncate">
                {fullName}
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <>
                {/* Click-away backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold truncate">{fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.phone}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">
                      {roleLabel[user.role] ?? user.role}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Users, User, UserCheck, LayoutDashboard, IdCard, ArrowLeftRight, FileBarChart, Package, Percent, Flag, BedDouble } from 'lucide-react';
import { NavItem } from '../../components/ui';
import ThemeLogo from '../../components/ThemeLogo';

export default function AdminLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { path: '/admin/staff', label: 'Staff', icon: UserCheck },
    { path: '/admin/participants', label: 'Participants', icon: Users },
    { path: '/admin/checkin', label: 'Check-In', icon: Flag },
    { path: '/admin/users', label: 'Users', icon: User },
    { path: '/admin/wristbands', label: 'Wristbands', icon: IdCard },
    { path: '/admin/transactions', label: 'Payments', icon: ArrowLeftRight },
    { path: '/admin/packages', label: 'Packages', icon: Package },
    { path: '/admin/coupons', label: 'Coupons', icon: Percent },
    { path: '/admin/add-ons', label: 'Weekend', icon: BedDouble },
    { path: '/admin/reports', label: 'Reports', icon: FileBarChart },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-cream via-background to-cream-dark overflow-x-hidden">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-7xl">
          <div className="flex justify-between items-center gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <ThemeLogo />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-display font-bold text-olive truncate">Admin Portal</h1>
                <p className="text-[11px] sm:text-sm text-muted-foreground truncate">System Management</p>
              </div>
            </div>

            {isAuthenticated && user && (
              <div className="flex gap-2 sm:gap-3 items-center shrink-0">
                <span className="text-sm text-muted-foreground hidden lg:inline">
                  Welcome back!
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline truncate max-w-40">
                  {user.phone || user.email} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors shrink-0"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Navigation — horizontally scrollable so it never overflows/clips on mobile */}
          <nav className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
            {navItems.map((item) => (
              <NavItem
                key={item.path}
                path={item.path}
                label={item.label}
                icon={item.icon}
                exact={item.exact}
              />
            ))}
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        <Outlet />
      </div>
    </div>
  );
}

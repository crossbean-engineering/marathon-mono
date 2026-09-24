import { Outlet } from 'react-router-dom';
import { Home, UserPlus, Flag } from 'lucide-react';
import { AuthHeader } from '../../components/AuthHeader';
import { NavItem } from '../../components/ui';

export default function AgentLayout() {
  const navItems = [
    { path: '/agent', label: 'Home', icon: Home, exact: true },
    { path: '/agent/register', label: 'Register', icon: UserPlus },
    { path: '/agent/checkin', label: 'Check-In', icon: Flag },
  ];

  return (
    <div className="">
      {/* Header */}
      <AuthHeader />

      <div className="container mx-auto px-4 py-4">
        <nav className="flex gap-0 sm:gap-2 overflow-x-auto scrollbar-none">
          {navItems.map((item) => (
            <NavItem
              hideLabelOnMobile={false}
              key={item.path}
              path={item.path}
              label={item.label}
              icon={item.icon}
              exact={item.exact}
            />
          ))}
        </nav>
      </div>

      {/* Page Content */}
      <div className="container mx-auto px-4 pb-8 pt-0 max-w-7xl">
        <Outlet />
      </div>
    </div>
  );
}

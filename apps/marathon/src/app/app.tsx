import { Route, Routes, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { participantRoutes } from './pages/participants/routes';
import { adminRoutes } from './pages/admin/routes';
import { agentRoutes } from './pages/agents/routes';
import LoginPage from './pages/auth/LoginPage';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import RegisterCallbackPage from './pages/RegisterCallbackPage';
import UnAuthorizedPage from './pages/UnAuthorizedPage';
import ParticipantScanPage from './pages/ParticipantScanPage';
import CheckinPage from './pages/CheckinPage';
import GetPassPage from './pages/GetPassPage';

export function App() {
  return (
    <div className="min-h-screen bg-linear-to-br from-cream via-background to-cream-dark">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/register-callback" element={<RegisterCallbackPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/get-pass" element={<GetPassPage />} />

        <Route path='/participant/:code' element={<ParticipantScanPage />}  />
        <Route path='/checkin/:code' element={<CheckinPage />} />
        
        {/* Protected Participant Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          {participantRoutes}
        </Route>

        {/* Protected Agent Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['agent']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          {agentRoutes}
        </Route>

        {/* Protected Admin Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          {adminRoutes}
        </Route>

        
        <Route path="/unauthorized" element={<UnAuthorizedPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}


export default App;
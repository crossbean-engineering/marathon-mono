import { Route } from 'react-router-dom';
import ParticipantDashboard from './ParticipantDashboard';
import PackageDetailsPage from './PackageDetailsPage';
import ParticipantTopUpCallback from './ParticipantTopupCallback';


export const participantRoutes = (
  <Route path="/participant">
    <Route index element={<ParticipantDashboard />} />
    <Route path="ticket/:ticketId" element={<PackageDetailsPage />} />
    <Route path="topup-callback" element={<ParticipantTopUpCallback />} />
  </Route>
);
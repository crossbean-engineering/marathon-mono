import { Route } from 'react-router-dom';
import AdminOverview from './Overview';
import AdminLayout from './layout';
import AdminStaff from './Staff';
import AdminParticipants from './Participants';
import AdminUsers from './Users';
import UserDetailsPage from './UserDetails';
import WristbandPage from './Wristband';
import WristbandDetailsPage from './WristbandDetails';
import ParticipantDetailsPage from './ParticipantDetails';
import AdminCheckIn from './CheckIn';
import PaymentsPage from './Transactions';
import PackagesPage from './Packages';
import CouponsPage from './Coupons';
import ReportsPage from './reports/Reports';


export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminOverview />} />
    <Route path="staff" element={<AdminStaff />} />
    <Route path="participants" element={<AdminParticipants />} />
    <Route path="participants/:participantId" element={<ParticipantDetailsPage  />} />
    <Route path="checkin" element={<AdminCheckIn />} />
    <Route path="users" element={<AdminUsers />} />
    <Route path="users/:userId" element={<UserDetailsPage />} />
    <Route path="wristbands" element={<WristbandPage /> }  />
    <Route path="wristbands/:wristbandId" element={<WristbandDetailsPage /> }  />
    <Route path="transactions" element={<PaymentsPage />} />
    <Route path="packages" element={<PackagesPage />} />
    <Route path="coupons" element={<CouponsPage />} />
    <Route path="reports" element={<ReportsPage />} />
  </Route>
);

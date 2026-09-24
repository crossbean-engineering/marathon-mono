import { Route } from 'react-router-dom';
import AgentHome from './pages/AgentHome';
import AgentLayout from './layout';
import RegisterParticipants from './pages/RegisterParticipants';
import CheckIn from './pages/CheckIn';


export const agentRoutes = (
  <Route path="/agent" element={<AgentLayout />} >
    <Route index element={<AgentHome />} />
    <Route path='register' element={<RegisterParticipants />} />
    <Route path='checkin' element={<CheckIn />} />
  </Route>
);

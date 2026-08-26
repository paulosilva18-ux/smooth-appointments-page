import React from 'react';
import { AdminDashboard } from './AdminDashboard';

interface Props {
  onBackToSite: () => void;
}

export const FabricioAdminDashboard: React.FC<Props> = ({ onBackToSite }) => {
  return <AdminDashboard onBackToSite={onBackToSite} />;
};

export default FabricioAdminDashboard;

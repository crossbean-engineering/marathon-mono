import StaffTab from './components/StaffTab';

export default function AdminStaff() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground">Staff Management</h2>
        <p className="text-muted-foreground mt-1">
          Manage agent and admin accounts
        </p>
      </div>
      <StaffTab />
    </>
  );
}

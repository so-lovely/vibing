import { useAuth } from '../contexts/AuthContext';
import { AdminProvider } from '../contexts/AdminContext';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function AdminPage() {
  const { user } = useAuth();

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              You don't have permission to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminProvider>
      <AdminDashboard />
    </AdminProvider>
  );
}
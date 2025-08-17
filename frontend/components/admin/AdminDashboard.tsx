import { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminStatsCards } from './AdminStats';
import { UserManagement } from './UserManagement';
import { ProductManagement } from './ProductManagement';
import { useAdmin } from '../../contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { stats, loading, fetchUsers, fetchProducts, fetchStats } = useAdmin();

  useEffect(() => {
    // Load initial data
    fetchStats();
    fetchUsers();
    fetchProducts();
  }, [fetchStats, fetchUsers, fetchProducts]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <AdminStatsCards stats={stats} loading={loading} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm">New user registered: John Doe</span>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm">Product approved: React UI Kit</span>
                      <span className="text-xs text-gray-500">4 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm">New seller application</span>
                      <span className="text-xs text-gray-500">1 day ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database</span>
                      <span className="text-sm text-green-600">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">File Storage</span>
                      <span className="text-sm text-green-600">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Payment Gateway</span>
                      <span className="text-sm text-green-600">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CDN</span>
                      <span className="text-sm text-green-600">Healthy</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'users':
        return <UserManagement />;
      case 'products':
        return <ProductManagement />;
      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Admin settings panel coming soon...</p>
            </CardContent>
          </Card>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'products' && 'Product Management'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
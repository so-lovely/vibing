import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../data/auth/mockData';
import { Product } from '../data/products/mockData';

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  monthlyGrowth: number;
}


interface AdminContextType {
  users: User[];
  products: Product[];
  stats: AdminStats;
  loading: boolean;
  fetchUsers: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchStats: () => Promise<void>;
  updateUserRole: (userId: string, role: 'buyer' | 'seller' | 'admin') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  approveProduct: (productId: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In real app, this would be an API call
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'developer@example.com',
          name: 'John Developer',
          role: 'buyer',
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          email: 'seller@example.com',
          name: 'Jane Seller',
          role: 'seller',
          createdAt: '2024-01-10T10:00:00Z'
        },
        {
          id: '3',
          email: 'admin@vibing.com',
          name: 'Admin User',
          role: 'admin',
          createdAt: '2024-01-01T10:00:00Z'
        },
        {
          id: '4',
          email: 'newuser@example.com',
          name: 'New User',
          role: 'buyer',
          createdAt: '2024-02-01T10:00:00Z'
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Import from existing product data
      const { mockProducts } = await import('../data/products/mockData');
      setProducts(mockProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockStats: AdminStats = {
        totalUsers: 156,
        totalProducts: 48,
        totalSales: 1247,
        totalRevenue: 89420,
        monthlyGrowth: 12.5
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };


  const updateUserRole = async (userId: string, role: 'buyer' | 'seller' | 'admin') => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role } : user
        )
      );
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  };

  const approveProduct = async (productId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId ? { ...product, status: 'approved' } : product
        )
      );
    } catch (error) {
      console.error('Failed to approve product:', error);
      throw error;
    }
  };

  const value = {
    users,
    products,
    stats,
    loading,
    fetchUsers,
    fetchProducts,
    fetchStats,
    updateUserRole,
    deleteUser,
    deleteProduct,
    approveProduct
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
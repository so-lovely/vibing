import { createContext, useContext, useState, ReactNode } from 'react';
import { adminApi, type AdminStats } from '../services/adminApi';

export type { AdminStats };
import type { User } from '../types/auth';
import type { Product } from '../types/product';


interface AdminContextType {
  users: User[];
  products: Product[];
  stats: AdminStats;
  loading: boolean;
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await adminApi.getUsers();
      setUsers(users);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const products = await adminApi.getProducts();
      setProducts(products);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await adminApi.getStats();
      setStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stats';
      setError(errorMessage);
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };


  const updateUserRole = async (userId: string, role: 'buyer' | 'seller' | 'admin') => {
    try {
      const updatedUser = await adminApi.updateUserRole(userId, role);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? updatedUser : user
        )
      );
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await adminApi.deleteUser(userId);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await adminApi.deleteProduct(productId);
      setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  };

  const approveProduct = async (productId: string) => {
    try {
      const updatedProduct = await adminApi.updateProductStatus(productId, 'approved');
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId ? updatedProduct : product
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
    error,
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
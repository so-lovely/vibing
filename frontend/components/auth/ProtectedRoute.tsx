import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { LoginDialog } from './LoginDialog';
import { Lock, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: 'buyer' | 'seller' | 'admin';
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, requireRole, fallback }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">로그인이 필요합니다</h2>
            <p className="text-muted-foreground">
              이 페이지에 접근하려면 먼저 로그인해주세요.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <LoginDialog>
              <Button>로그인</Button>
            </LoginDialog>
            <Button variant="outline">둘러보기</Button>
          </div>
        </div>
      </div>
    );
  }

  if (requireRole && user?.role !== requireRole) {
    const roleNames = {
      admin: '관리자',
      seller: '판매자',
      buyer: '구매자'
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">접근 권한이 없습니다</h2>
            <p className="text-muted-foreground">
              이 페이지는 {roleNames[requireRole]} 권한이 필요합니다.
            </p>
          </div>
          
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              현재 계정: {user?.name} ({roleNames[user?.role as keyof typeof roleNames]})
            </AlertDescription>
          </Alert>
          
          <Button variant="outline" onClick={() => window.history.back()}>
            이전 페이지로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
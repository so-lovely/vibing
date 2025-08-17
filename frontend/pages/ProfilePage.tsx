import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { User, Mail, Shield, Edit, Save, X } from 'lucide-react';

export function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'seller': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'seller': return '판매자';
      default: return '구매자';
    }
  };

  const handleSave = () => {
    // In a real app, this would call an API to update user info
    console.log('Saving user data:', editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser({
      name: user.name,
      email: user.email,
    });
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">프로필</h1>
        <p className="text-muted-foreground">계정 정보를 확인하고 관리하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <Badge variant="outline" className={`w-fit mx-auto ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                계정 정보
              </CardTitle>
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  편집
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4 mr-2" />
                    취소
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    저장
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editedUser.name}
                      onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">{user.name}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedUser.email}
                      onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">{user.email}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>역할</Label>
                  <div className="p-2 bg-muted rounded-md">
                    <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>가입일</Label>
                  <div className="p-2 bg-muted rounded-md">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics (for sellers and admins) */}
          {(user.role === 'seller' || user.role === 'admin') && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>계정 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user.role === 'seller' && (
                    <>
                      <div className="text-center p-4 bg-muted rounded-md">
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-sm text-muted-foreground">등록된 상품</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-md">
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-sm text-muted-foreground">총 판매량</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-md">
                        <div className="text-2xl font-bold">₩0</div>
                        <div className="text-sm text-muted-foreground">총 수익</div>
                      </div>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <div className="text-center p-4 bg-muted rounded-md">
                        <div className="text-2xl font-bold">12</div>
                        <div className="text-sm text-muted-foreground">총 사용자</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-md">
                        <div className="text-2xl font-bold">12</div>
                        <div className="text-sm text-muted-foreground">총 상품</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-md">
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-sm text-muted-foreground">보류중인 승인</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
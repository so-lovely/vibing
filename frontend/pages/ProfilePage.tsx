import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { User, Mail, Shield, Edit, Save, X } from 'lucide-react';
import { apiClient } from '../services/api';
import type { UpdateProfileResponse } from '../types/auth';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
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

  const handleSave = async () => {
    if (!editedUser.name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    
    setIsUpdating(true);
    try {
      const response = await apiClient.put<UpdateProfileResponse>('/auth/profile', {
        name: editedUser.name.trim(),
      });
      
      // Update user data in context
      if (updateUser) {
        updateUser(response.user);
      }
      
      setIsEditing(false);
      alert('프로필이 성공적으로 수정되었습니다.');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMessage = error?.message || '프로필 수정에 실패했습니다.';
      alert(`수정 실패: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditedUser({
      name: user.name,
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
                    disabled={isUpdating}
                  >
                    <X className="h-4 w-4 mr-2" />
                    취소
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSave}
                    disabled={isUpdating}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isUpdating ? '저장 중...' : '저장'}
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
                      disabled={isUpdating}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">{user.name}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <div className="p-2 bg-muted rounded-md text-muted-foreground">{user.email}</div>
                  <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다.</p>
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

        </div>
      </div>
    </div>
  );
}
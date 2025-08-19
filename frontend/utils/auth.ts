// Global auth utility functions

export const clearAuthData = () => {
  localStorage.removeItem('auth-token');
  localStorage.removeItem('auth-user');
};

export const handleSessionExpiration = () => {
  console.log('Session expired, logging out...');
  clearAuthData();
  
  // Show user-friendly message
  alert('세션이 만료되었습니다. 다시 로그인해주세요.');
  
  // Redirect to home page to trigger re-render with logged out state
  window.location.href = '/';
};

// Event system for session expiration
class AuthEventEmitter {
  private listeners: Array<() => void> = [];

  addListener(listener: () => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: () => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  emit() {
    this.listeners.forEach(listener => listener());
  }
}

export const authEventEmitter = new AuthEventEmitter();
import { User, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { LoginDialog } from "./auth/LoginDialog";
import { SignupDialog } from "./auth/SignupDialog";
import { UserMenu } from "./auth/UserMenu";
import { useAuth } from "../contexts/AuthContext";

export function Header() {
  const [isDark, setIsDark] = useState(true);
  const { isAuthenticated, loading} = useAuth();

  useEffect(() => {
    // Sync state with actual DOM class
    const htmlElement = document.documentElement;
    setIsDark(htmlElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const htmlElement = document.documentElement;
    const newIsDark = !isDark;
    
    if (newIsDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    
    setIsDark(newIsDark);
    
    // Debug: Force a re-render to make sure styles update
    console.log('Theme toggled to:', newIsDark ? 'dark' : 'light', 'Classes:', htmlElement.classList.toString());
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">&lt;/&gt;</span>
          </div>
          <span className="text-xl font-bold">Vibing</span>
        </Link>

  

        {/* Navigation & Actions */}
        <div className="flex items-center space-x-4">
          
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        
          
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            </div>
          ) : isAuthenticated ? (
            <UserMenu />
          ) : (
            <div className="flex items-center space-x-2">
              <LoginDialog>
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">로그인</span>
                </Button>
              </LoginDialog>
              
              <SignupDialog>
                <Button size="sm">
                  <span className="hidden sm:inline">회원가입</span>
                  <span className="sm:hidden">가입</span>
                </Button>
              </SignupDialog>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
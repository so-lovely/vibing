import { Github } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">&lt;/&gt;</span>
              </div>
              <span className="text-xl font-bold">Vibing</span>
            </div>
            <p className="text-muted-foreground text-sm">
              최고의 소프트웨어 마켓플레이스. 
              고품질 도구와 서비스를 한 곳에서 만나보세요.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon">
                <Github className="w-4 h-4" />
              </Button>
            </div>
          </div>




          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold">회사</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">소개</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">파트너십</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">지원</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">도움말 센터</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">판매자 가이드</a></li>
 
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">문의하기</a></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2025 Vibing. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">이용약관</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">개인정보처리방침</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">쿠키 정책</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
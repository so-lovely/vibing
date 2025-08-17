
import { Code, Zap, Users } from "lucide-react";

export function HeroSection() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            최고의 소프트웨어 마켓플레이스
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            라이브러리, CLI 도구, 웹사이트 템플릿부터 커스텀 서비스까지. 
            개발자의 생산성을 높이는 모든 것을 한 곳에서 만나보세요.
          </p>
          

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="flex flex-col items-center p-6 rounded-lg bg-card border">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">고품질 코드</h3>
              <p className="text-muted-foreground text-center">
                검증된 라이브러리와 도구만 엄선해서 제공합니다
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-lg bg-card border">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">즉시 사용 가능</h3>
              <p className="text-muted-foreground text-center">
                구매 후 다운로드를 즉시 제공받으세요
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-lg bg-card border">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">개발자 커뮤니티</h3>
              <p className="text-muted-foreground text-center">
                리뷰와 평점으로 최고의 선택을 할 수 있습니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
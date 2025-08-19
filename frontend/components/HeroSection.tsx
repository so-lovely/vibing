
import { useEffect, useState } from "react";

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/3" />
      
      {/* Minimal geometric accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-px h-32 bg-gradient-to-b from-transparent via-border to-transparent opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-40" />
      </div>

      {/* Main content */}
      <div className={`relative z-10 text-center transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="space-y-6">
          <div className="relative inline-block">
            <h1 className="text-8xl font-light tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              VIBING
            </h1>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
          
          <p className="text-lg text-muted-foreground font-light tracking-wide">
            Developer Marketplace
          </p>
        </div>
      </div>

      {/* Subtle animated dots */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-primary/20 rounded-full"
            style={{
              left: `${20 + (i * 12)}%`,
              top: `${60 + (i % 2 === 0 ? 10 : -5)}%`,
              animation: `fade ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes fade {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </section>
  );
}
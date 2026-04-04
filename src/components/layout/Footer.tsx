import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-8 mt-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-3">
          {/* Link único envolvendo Logo e Texto */}
          <a 
            href="https://www.vluma.com.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center space-y-2 group transition-opacity hover:opacity-80"
          >
            {/* Logo da pasta public */}
            <img 
              src="/logo.png" 
              alt="Vluma Logo" 
              className="h-8 w-auto object-contain"
            />
            
            {/* Texto de Copyright */}
            <div className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
              © 2026 Vluma. Todos os direitos reservados.
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
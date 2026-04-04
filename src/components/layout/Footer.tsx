import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-6 mt-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Logo e Link */}
          <div className="flex items-center space-x-4">
            <span className="text-lg font-bold text-primary">Vluma</span>
            <a 
              href="https://www.vluma.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
            >
              www.vluma.com.br
            </a>
          </div>
          
          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground">
            © 2026 Vluma. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

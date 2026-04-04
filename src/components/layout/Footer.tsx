"use client";

import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full border-t border-border bg-white dark:bg-gray-900 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <a 
            href="https://www.vluma.com.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center space-y-2 group hover:opacity-80 transition-all"
          >
            <img 
              src="/logo.png" 
              alt="Vluma Logo" 
              className="h-10 w-auto object-contain mb-1"
              onError={(e) => {
                // Fallback caso a imagem não carregue
                e.currentTarget.style.display = 'none';
              }}
            />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
              © 2026 Vluma. Todos os direitos reservados.
            </p>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
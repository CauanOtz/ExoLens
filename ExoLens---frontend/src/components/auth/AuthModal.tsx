// src/components/auth/AuthModal.tsx

import React, { useState, useEffect } from 'react';
import './AuthModal.css';

// Definimos as props que o componente vai receber
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [activeView, setActiveView] = useState(initialView);

  // Se a prop initialView mudar, atualizamos o estado interno
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  // Se o modal não estiver aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  return (
    // O overlay escuro que cobre a tela
    <div className="auth-modal-overlay" onClick={onClose}>
      {/* O container do modal em si. O stopPropagation evita que o clique dentro feche o modal */}
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close-btn" onClick={onClose}>×</button>

        {/* Abas para trocar entre Login e Cadastro */}
        <div className="view-switcher">
          <button 
            className={`switch-btn ${activeView === 'login' ? 'active' : ''}`}
            onClick={() => setActiveView('login')}
          >
            Entrar
          </button>
          <button 
            className={`switch-btn ${activeView === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveView('signup')}
          >
            Criar Conta
          </button>
        </div>

        {/* Renderização condicional do formulário */}
        {activeView === 'login' ? (
          <div className="form-container">
            <h2>Bem-vindo de volta!</h2>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input id="login-email" type="email" placeholder="seu@email.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Senha</label>
                <input id="login-password" type="password" placeholder="••••••••" required />
              </div>
              <a href="#" className="forgot-password">Esqueceu sua senha?</a>
              <button type="submit" className="submit-btn">Entrar</button>
            </form>
          </div>
        ) : (
          <div className="form-container">
            <h2>Crie sua conta no ExoLens</h2>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="signup-name">Nome</label>
                <input id="signup-name" type="text" placeholder="Seu nome completo" required />
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input id="signup-email" type="email" placeholder="seu@email.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Senha</label>
                <input id="signup-password" type="password" placeholder="Crie uma senha forte" required />
              </div>
              <button type="submit" className="submit-btn">Criar Conta</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
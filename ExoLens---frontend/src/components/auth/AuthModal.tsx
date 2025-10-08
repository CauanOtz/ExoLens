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
  if (!isOpen) return null;

  // Shared styles (keeps component self-contained)
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px) saturate(0.9)', zIndex: 2000, padding: 20
  };
  const boxStyle: React.CSSProperties = {
    width: 'min(420px, 96%)', borderRadius: 14, padding: 20, position: 'relative',
    // darker frosted glass
    background: 'linear-gradient(180deg, rgba(12,12,12,0.64), rgba(6,6,6,0.52))',
    border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 18px 60px rgba(0,0,0,0.8)'
  };
  // make modal layout vertical (portrait) and scrollable on small screens
  const boxInnerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' };
  const closeBtnStyle: React.CSSProperties = {
    position: 'absolute', right: 12, top: 12, background: 'transparent', border: 'none',
    color: '#fff', fontSize: 22, cursor: 'pointer'
  };
  const switchBtnBase: React.CSSProperties = {
    flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)',
    background: 'transparent', color: '#f2f2f2', cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 40
  };
  const activeSwitchBtn: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)', color: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)'
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)', color: '#fff', outline: 'none', marginTop: 6, boxSizing: 'border-box'
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, color: '#e6e6e6', fontWeight: 700 };
  const submitBtnStyle: React.CSSProperties = {
    marginTop: 12, width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none',
    background: '#ffffff', color: '#0b0b0b', fontWeight: 800, cursor: 'pointer', fontSize: 15
  };
  const subtleLink: React.CSSProperties = { color: '#dcdcdc', fontSize: 13, textDecoration: 'underline', cursor: 'pointer' };

  const logoSrc = new URL('../../assets/NOISE/NoiseLogo.png', import.meta.url).href;

  return (
    <div style={overlayStyle} onClick={onClose} aria-modal="true" role="dialog" aria-labelledby="auth-modal-title">
      <div style={boxStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <img src={logoSrc} alt="ExoLens logo" style={{ width: 96, marginBottom: 12, borderRadius: 12, objectFit: 'cover' }} />
        </div>
        <button aria-label="Fechar" style={closeBtnStyle} onClick={onClose}>×</button>

        <div style={boxInnerStyle}>
          <div style={{ width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                style={{ ...switchBtnBase, flex: 1, ...(activeView === 'login' ? activeSwitchBtn : {}) }}
                onClick={() => setActiveView('login')}
              >
                Entrar
              </button>
              <button
                style={{ ...switchBtnBase, flex: 1, ...(activeView === 'signup' ? activeSwitchBtn : {}) }}
                onClick={() => setActiveView('signup')}
              >
                Criar Conta
              </button>
            </div>

            {activeView === 'login' ? (
              <div>
                <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle} htmlFor="login-email">Email</label>
                    <input id="login-email" type="email" placeholder="seu@email.com" required style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle} htmlFor="login-password">Senha</label>
                    <input id="login-password" type="password" placeholder="••••••••" required style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                    <a style={{ ...subtleLink, alignSelf: 'flex-start' }} href="#" onClick={(e)=>e.preventDefault()}>Esqueceu sua senha?</a>
                    <button type="submit" style={submitBtnStyle}>Entrar</button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle} htmlFor="signup-name">Nome</label>
                    <input id="signup-name" type="text" placeholder="Seu nome completo" required style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle} htmlFor="signup-email">Email</label>
                    <input id="signup-email" type="email" placeholder="seu@email.com" required style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle} htmlFor="signup-password">Senha</label>
                    <input id="signup-password" type="password" placeholder="Crie uma senha forte" required style={inputStyle} />
                  </div>
                  <button type="submit" style={submitBtnStyle}>Criar Conta</button>
                </form>
                <div style={{ marginTop: 12, textAlign: 'center', color: '#dcdcdc', fontSize: 13 }}>
                  Ao criar a conta você concorda com nossos termos.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
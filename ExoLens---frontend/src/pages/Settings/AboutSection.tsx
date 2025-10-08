// src/pages/Settings/AboutSection.tsx
import './SettingsPage.css';
import { createPortal } from 'react-dom';
import { TeamMemberCard } from '../../layouts/TeamMemberCard'; // Ajuste o caminho para o layout
// Importe seu vídeo e imagens (usando arquivos presentes em src/assets)
import user1 from '../../assets/NOISE/MARCIO.png';
import user2 from '../../assets/NOISE/GERMANO.png';
import user3 from '../../assets/NOISE/CAUAN.png';
import user4 from '../../assets/NOISE/FOGACA.png';
import user5 from '../../assets/NOISE/KAIQUE.png';
import user6 from '../../assets/NOISE/ENRICO.png';
import noiseVideo from '../../assets/NOISE/noise_video.mp4';
import challengeImage from '../../assets/space.jpg';

// Dados da equipe (exemplo)
const teamData = [
  { name: 'MARCIOTR', role: 'Líder de Projeto | Dev. BackEnd/ CSN', imageUrl: user1 },
  { name: 'GERMANOGLP', role: 'Dev. Back-End | LLM', imageUrl: user2 },
  { name: 'CAUANOTZ', role: 'Dev. Front-ent/UX-UI Designer', imageUrl: user3 },
  { name: 'FILIPEFGC', role: 'Dev. Front-ent/UX-UI Designer', imageUrl: user4 },
  { name: 'KAIQUEAM', role: 'Dev. BackEnd | APIs' , imageUrl: user5 },
  { name: 'ENRICOMDP', role: 'Dev. Back-End | Pitch', imageUrl: user6 },
];

interface AboutSectionProps {
  onClose: () => void;
}

export function AboutSection({ onClose }: AboutSectionProps) {
  const content = (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-content-wrapper" onClick={(e) => e.stopPropagation()}>
        <button className="about-close-btn" onClick={onClose}>×</button>
        
        {/* --- Seção 1: Vídeo e Resumo --- */}
        <header className="about-hero">
          <video src={noiseVideo} className="background-video" autoPlay loop muted playsInline />
          <div className="hero-content">
            <h1>About ExoLens</h1>
            <p>An interactive journey through the cosmos — explore and create new worlds using real data and imagination.</p>
          </div>
        </header>

        <main className="about-main-content">
          {/* --- Seção 2: O Desafio --- */}
          <section className="about-section challenge-section">
            <img src={challengeImage} alt="Exploration challenge" className="section-image" />
            <div className="section-text">
              <h2>The Challenge</h2>
              <p>The goal was to build a visually striking and educational platform that lets users not only view known exoplanets, but procedurally generate new worlds based on astrophysical rules — combining science, design and modern technology.</p>
            </div>
          </section>

          {/* --- Seção 3: A Equipe --- */}
          <section className="about-section team-section">
            <h2>Our Team</h2>
            <div className="team-grid">
              {teamData.map(member => (
                <TeamMemberCard 
                  key={member.name}
                  name={member.name}
                  role={member.role}
                  imageUrl={member.imageUrl}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );

  // Render via portal so overlay attaches to document.body and is not affected
  // by ancestor transforms or stacking contexts inside the layout.
  return createPortal(content, document.body);
}
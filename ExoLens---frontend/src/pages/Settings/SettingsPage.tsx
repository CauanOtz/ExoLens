import { useState } from 'react';
import { AboutSection } from './AboutSection';
import './SettingsPage.css';

export function SettingsPage() {
  const [isAboutVisible, setAboutVisible] = useState(false);

  return (
    <div className="settings-container">
      <button className="about-trigger-button" onClick={() => setAboutVisible(true)}>Sobre o Projeto</button>
      {isAboutVisible && <AboutSection onClose={() => setAboutVisible(false)} />}
    </div>
  );
}

export default SettingsPage;

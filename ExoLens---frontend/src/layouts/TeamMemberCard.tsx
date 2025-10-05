// src/components/TeamMemberCard.tsx

import React from 'react';

interface TeamMemberCardProps {
  imageUrl: string;
  name: string;
  role: string;
}

export function TeamMemberCard({ imageUrl, name, role }: TeamMemberCardProps) {
  return (
    <div className="team-card">
      <img src={imageUrl} alt={name} className="team-member-photo" />
      <h3 className="team-member-name">{name}</h3>
      <p className="team-member-role">{role}</p>
    </div>
  );
}
import React, { useState } from 'react';
import './Sprite.css';

interface MinotaurSpriteProps {
  className?: string;
  onAttackComplete?: () => void;
}

export default function MinotaurSprite({ className = "" }: MinotaurSpriteProps) {
  const [isAttacking, setIsAttacking] = useState(false);

  const handleAttack = () => {
    if (isAttacking) return;
    setIsAttacking(true);

    setTimeout(() => {
      setIsAttacking(false);
    }, 500);
  };

  return (
    <div className={`battle-arena ${className}`}>
      <div 
        className={`minotaur-sprite ${isAttacking ? 'attack' : ''}`}
        onClick={handleAttack}
        title="Clique para atacar!"
      />
    </div>
  );
}
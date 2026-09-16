// Sprite do Minotauro — usa a ilustração real em vez de SVG genérico.
// Recebe className com as mesmas classes (battle-sprite + anim-*) que
// PlayerSprite/EnemySprite recebem, então herda de graça as mesmas
// animações de ataque/dano/esquiva/vitória/derrota definidas em
// globals.css — nada de CSS ou estado de animação próprio aqui.
export default function MinotauroSprite({ className = "" }: { className?: string }) {
  return (
    <img
      src="/images/minotauro.jpg"
      alt="Minotauro"
      className={`${className} rounded-2xl border-2 border-[#8b0000] object-cover shadow-[0_0_16px_rgba(139,0,0,0.5)]`}
    />
  );
}

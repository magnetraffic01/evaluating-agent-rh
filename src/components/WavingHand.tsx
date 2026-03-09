import { motion, useAnimationControls } from 'framer-motion';
import { useEffect } from 'react';

interface WavingHandProps {
  size?: number;        // px del ícono
  className?: string;
  autoPlay?: boolean;   // si arranca solo al montar
  loop?: boolean;       // si repite la animación
}

/**
 * Ícono de mano saludando animado con Framer Motion.
 * Colores del diseño: dorado primario (#D4AF37) con sombra gold.
 * La animación replica el movimiento natural de una mano saludando:
 * inclinación lateral con rebote en los extremos.
 */
export default function WavingHand({
  size = 36,
  className = '',
  autoPlay = true,
  loop = true,
}: WavingHandProps) {
  const controls = useAnimationControls();

  // Secuencia de wave: 0° → 20° → -15° → 20° → -10° → 5° → 0°
  const waveSequence = async () => {
    await controls.start({
      rotate: [0, 20, -15, 20, -10, 5, 0],
      transition: {
        duration: 1.4,
        times: [0, 0.15, 0.35, 0.55, 0.72, 0.87, 1],
        ease: 'easeInOut',
      },
    });
    if (loop) {
      await new Promise((r) => setTimeout(r, 2200)); // pausa entre waves
      waveSequence();
    }
  };

  useEffect(() => {
    if (autoPlay) waveSequence();
  }, []);

  return (
    <motion.span
      animate={controls}
      style={{
        display: 'inline-block',
        fontSize: size,
        lineHeight: 1,
        transformOrigin: 'bottom center',
        cursor: 'default',
        // Sombra dorada sutil
        filter: 'drop-shadow(0 2px 8px rgba(212, 175, 55, 0.45))',
      }}
      className={className}
      aria-label="Mano saludando"
      role="img"
    >
      ✋
    </motion.span>
  );
}

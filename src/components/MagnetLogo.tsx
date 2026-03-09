interface MagnetLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { img: 'h-8 w-8',   text: 'text-base' },
  md: { img: 'h-10 w-10', text: 'text-xl'   },
  lg: { img: 'h-14 w-14', text: 'text-3xl'  },
};

export default function MagnetLogo({ size = 'md' }: MagnetLogoProps) {
  const s = sizeMap[size];
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight ${s.text}`}>
      <img
        src="/LogoMagnetraffic.png"
        alt="Magnetraffic"
        className={`${s.img} object-contain`}
      />
      <span>
        <span className="text-foreground">Magnetraffic</span>
        <span className="gold-gradient-text ml-1">HR</span>
      </span>
    </div>
  );
}

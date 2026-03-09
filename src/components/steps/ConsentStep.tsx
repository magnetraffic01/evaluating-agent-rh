import WavingHand from '@/components/WavingHand';

interface Props {
  name: string;
  onNext: (data: Record<string, any>) => void;
  onDisqualify: (reason: string) => void;
}

export default function ConsentStep({ name, onNext, onDisqualify }: Props) {
  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-6">Antes de empezar</h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed mb-8">
        <p className="flex items-center gap-2">
          <WavingHand size={22} />
          Hola, soy el sistema de evaluación de Magnetraffic
        </p>
        <p>Veo que te interesó la oportunidad de closer remoto para el mercado hispano en EE.UU.</p>
        <p>Tenemos una evaluación estructurada antes de la entrevista. ¿Deseas continuar?</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onNext({ consent: true })}
          className="flex-1 gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Sí, quiero continuar
        </button>
        <button
          onClick={() => onDisqualify('rechazo_inicial')}
          className="flex-1 border border-muted-foreground/30 text-muted-foreground font-medium py-3 px-6 rounded-full transition-all hover:bg-muted"
        >
          No, gracias
        </button>
      </div>
    </div>
  );
}

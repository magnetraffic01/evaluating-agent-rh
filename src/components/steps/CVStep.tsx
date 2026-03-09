import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link2, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { uploadCV, validateFile } from '@/lib/storage';

interface Props {
  sessionId: string;
  onNext: (data: Record<string, any>) => void;
  onDisqualify: (reason: string) => void;
}

type Tab = 'url' | 'file';

export default function CVStep({ sessionId, onNext, onDisqualify }: Props) {
  const [tab, setTab] = useState<Tab>('url');

  // URL tab
  const [url, setUrl] = useState('');

  // File tab
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploaded, setUploaded] = useState<{ path: string; signedUrl: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [attempts, setAttempts] = useState(0);
  const [formError, setFormError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // ── Manejo de archivo ────────────────────────────────────────────────────────

  const handleFile = (f: File) => {
    const err = validateFile(f);
    if (err) { setFileError(err); setFile(null); return; }
    setFileError('');
    setFile(f);
    setUploaded(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadPct(0);
    setFileError('');

    const result = await uploadCV(file, sessionId, setUploadPct);

    setUploading(false);
    if (!result.ok) {
      setFileError(`Error al subir: ${result.error}`);
      return;
    }
    setUploaded({ path: result.path, signedUrl: result.signedUrl });
  };

  const clearFile = () => {
    setFile(null);
    setUploaded(null);
    setFileError('');
    setUploadPct(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    setFormError('');

    if (tab === 'url') {
      const trimmed = url.trim();
      if (!trimmed) {
        if (attempts >= 1) { onDisqualify('no_envio_cv'); return; }
        setAttempts(a => a + 1);
        setFormError(attempts === 0
          ? 'Por favor ingresa tu URL de LinkedIn o CV. Este es tu último intento.'
          : 'Necesitamos tu CV para continuar.');
        return;
      }
      onNext({ linkedinUrl: trimmed, cvUrl: trimmed });
      return;
    }

    // Tab archivo
    if (!uploaded) {
      if (!file) {
        if (attempts >= 1) { onDisqualify('no_envio_cv'); return; }
        setAttempts(a => a + 1);
        setFormError('Selecciona y sube un archivo. Este es tu último intento.');
        return;
      }
      setFormError('Haz clic en "Subir archivo" primero.');
      return;
    }

    onNext({ cvUrl: uploaded.signedUrl, linkedinUrl: '' });
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-2">Tu expediente</h2>
      <p className="text-muted-foreground text-sm leading-relaxed mb-6">
        Último paso: para enviarte el enlace de entrevista necesitamos tu perfil.
        Puedes pegar tu URL de LinkedIn o subir tu CV directamente.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl mb-6">
        {([
          { id: 'url',  label: 'LinkedIn / URL', icon: Link2   },
          { id: 'file', label: 'Subir archivo',  icon: Upload  },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setFormError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-background text-foreground shadow-sm gold-shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Tab URL ─────────────────────────────────────────────────────────── */}
        {tab === 'url' && (
          <motion.div
            key="url"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-sm font-medium text-foreground mb-2">
              URL de LinkedIn o CV online
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setFormError(''); }}
              placeholder="https://linkedin.com/in/tu-perfil"
              className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </motion.div>
        )}

        {/* ── Tab Archivo ─────────────────────────────────────────────────────── */}
        {tab === 'file' && (
          <motion.div
            key="file"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Zona de drop */}
            {!uploaded && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : file
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText size={22} className="text-primary shrink-0" />
                    <div className="text-left">
                      <p className="text-foreground text-sm font-medium">{file.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="mx-auto mb-3 text-muted-foreground/60" />
                    <p className="text-foreground text-sm font-medium mb-1">
                      Arrastra tu archivo aquí o haz clic para seleccionar
                    </p>
                    <p className="text-muted-foreground text-xs">
                      PDF, DOC, DOCX, JPG, PNG, WEBP · Máx. 5 MB
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Progreso de upload */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subiendo archivo...</span>
                  <span>{uploadPct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadPct}%` }}
                    className="h-full gold-gradient rounded-full"
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Estado: subido con éxito */}
            {uploaded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-xl px-4 py-3"
              >
                <CheckCircle size={18} className="text-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-success text-sm font-medium">Archivo subido correctamente</p>
                  <p className="text-muted-foreground text-xs truncate">{file?.name}</p>
                </div>
                <button
                  onClick={clearFile}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X size={15} />
                </button>
              </motion.div>
            )}

            {/* Error de archivo */}
            {fileError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-destructive text-sm"
              >
                <AlertCircle size={14} />
                {fileError}
              </motion.p>
            )}

            {/* Botón de subida */}
            {file && !uploaded && !uploading && (
              <button
                onClick={handleUpload}
                className="shimmer-btn w-full border border-primary/40 text-primary font-semibold py-2.5 rounded-full hover:bg-primary/10 transition-all"
              >
                Subir archivo →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error general */}
      {formError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-destructive text-sm mt-3"
        >
          <AlertCircle size={14} />
          {formError}
        </motion.p>
      )}

      {/* Botón principal */}
      <button
        onClick={handleSubmit}
        disabled={uploading}
        className="shimmer-btn mt-6 w-full gold-gradient text-primary-foreground font-bold py-3.5 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            Subiendo...
          </span>
        ) : (
          'Finalizar Evaluación →'
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground/50 mt-3">
        Tu información es confidencial y solo la verá el equipo de Magnetraffic
      </p>
    </div>
  );
}

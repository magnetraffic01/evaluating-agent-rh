export type Lang = 'es' | 'en';

const translations = {
  es: {
    // General
    continue: 'Continuar →',
    footer_confidential: 'Proceso confidencial · Magnetraffic © 2025',
    footer_thanks: 'Gracias por tu tiempo',
    session_not_found: 'Sesión no encontrada.',
    invalid_link: 'Enlace inválido. Contacta a tu reclutador.',

    // Evaluate — welcome
    welcome_subtitle: 'Evaluación de Closer Comercial Remoto',
    welcome_description:
      'Esta evaluación toma aproximadamente 15-20 minutos. Responde con honestidad — evaluamos criterio real, no respuestas perfectas. El proceso debe completarse sin interrupciones.',
    welcome_badge_time: '⏱ 15-20 minutos',
    welcome_badge_nopause: '📱 Sin pausas',
    welcome_badge_unique: '🎯 Evaluación única',
    welcome_start: 'Comenzar Evaluación →',
    step_progress: 'Paso {step} de {total}',

    // Step 0 — Consent
    consent_title: 'Antes de empezar',
    consent_greeting: 'Hola, soy el sistema de evaluación de Magnetraffic',
    consent_interest:
      'Veo que te interesó la oportunidad de closer remoto para el mercado hispano en EE.UU.',
    consent_question:
      'Tenemos una evaluación estructurada antes de la entrevista. ¿Deseas continuar?',
    consent_yes: 'Sí, quiero continuar',
    consent_no: 'No, gracias',

    // Step 1 — Basic Info
    basic_title: 'Información básica',
    basic_description:
      'Perfecto, {name}. Necesito confirmar algunos datos.\n\n¿Desde qué ciudad y país nos escribes, y estás disponible para trabajar full time (más de 30 horas por semana)?',
    basic_location_label: 'Ciudad y país de residencia',
    basic_location_placeholder: 'Ej: Bogotá, Colombia',
    basic_availability_label: 'Disponibilidad semanal',
    basic_more30: 'Más de 30 horas semanales ✓',
    basic_less30: 'Menos de 30 horas semanales',

    // Step 2 — Experience
    exp_title: 'Tu experiencia comercial',
    exp_description:
      'Cuéntame de tu experiencia en ventas: ¿qué vendías, qué herramientas digitales usabas, y ese cierre era por teléfono/video o era presencial?',
    exp_placeholder: 'Describe tu experiencia con el mayor detalle posible...',
    exp_hint: 'Sé específico — esto nos ayuda a entender tu perfil real',

    // Step 3 — Closing Role
    closing_title: 'Tu rol en el cierre',
    closing_role_q:
      'En esa experiencia, ¿eras tú quien cerraba la venta final y cobraba, o tu rol era más de apoyo?',
    closing_volume_q:
      '¿Cuántas llamadas efectivas (con prospecto real) hacías en un día normal de trabajo?',
    closing_role_1: 'Sí, yo cerraba y cobraba directamente',
    closing_role_2: 'Apoyaba el cierre pero no era el responsable final',
    closing_role_3: 'Solo hacía demos o presentaciones',
    closing_role_4: 'No tenía responsabilidad de cierre',
    closing_vol_1: '40 o más llamadas',
    closing_vol_2: 'Entre 20 y 39 llamadas',
    closing_vol_3: 'Entre 10 y 19 llamadas',
    closing_vol_4: 'Menos de 10 llamadas',

    // Step 4 — Income
    income_title: 'Tu historial de resultados',
    income_description:
      '¿Cuánto ganabas en comisiones en un buen mes? Y cuéntame, ¿cómo terminó esa etapa?',
    income_label: 'Ingresos en comisiones (USD o equivalente)',
    income_exit_label: '¿Cómo terminó esa experiencia?',
    income_exit_placeholder: 'Sé honesto, es parte de la evaluación...',

    // Step 5 — Reactivation
    react_title: 'Habilidad de reactivación',
    react_description:
      'Cuando un prospecto te deja en visto después de mostrar interés, ¿cómo lo reactivas?\n\nEscríbeme el mensaje REAL que le mandarías. No el concepto — el mensaje literal.',
    react_placeholder: 'Escribe exactamente lo que le enviarías...',
    react_chars: '{count} / 500 caracteres',

    // Step 6 — Objection
    objection_title: 'Manejo de objeciones',
    objection_setup: 'Imagina que estás en llamada conmigo y yo te digo:',
    objection_quote: '💬 "Me interesa, pero está muy cara"',
    objection_description:
      '¿Qué me respondes exactamente? Escribe tu respuesta como si estuvieras en la llamada.',
    objection_placeholder: 'Tu respuesta en la llamada...',

    // Step 7 — Autonomy
    autonomy_title: 'Tu método de trabajo',
    autonomy_description:
      'Trabajando 100% en remoto, ¿cómo organizas tu día de ventas y tu pipeline sin un jefe supervisándote?',
    autonomy_placeholder: 'Describe tu rutina y sistema real...',

    // Step 8 — Philosophy
    philo_title: 'Criterio comercial',
    philo_description:
      'Una pregunta de criterio:\n\n¿Qué es más importante para un closer exitoso?',
    philo_a_title: 'Convertir un "no" en "sí"',
    philo_a_desc: 'La habilidad de persuadir al cliente que duda',
    philo_b_title: 'Precalificar mejor',
    philo_b_desc: 'Llegar más rápido al cliente ideal y no desperdiciar tiempo',
    philo_c_title: 'Depende del contexto',
    philo_c_desc: 'Depende del contexto y del tipo de venta',
    philo_explain_label: 'Explica brevemente tu respuesta',
    philo_explain_placeholder: 'Tu razonamiento...',

    // Step 9 — Verification
    verif_title: 'Verificación de datos',
    verif_description:
      'Oye, revisando mis notas... creo que me dijiste que hacías unas {half} llamadas al día, ¿verdad?',
    verif_correct: 'No, eran {calls} llamadas',
    verif_incorrect: 'Sí, eso fue lo que dije',
    verif_almost: 'Estamos en la recta final. Dos preguntas más y tenemos todo.',

    // Step 10 — Stability
    stability_title: 'Trayectoria profesional',
    stability_description:
      '{name}, ¿cuántos empleos o proyectos distintos has tenido en los últimos 3 años?',
    stability_1: '1 trabajo o proyecto',
    stability_2: '2 trabajos o proyectos',
    stability_3: '3 o más trabajos o proyectos',

    // Step 11 — Financial
    financial_title: 'Última pregunta',
    financial_description:
      'Para que el proyecto funcione bien desde el inicio, necesito ser directo contigo:\n\n¿Tienes una base financiera estable mientras arrancas, o estás en una situación donde necesitas ingresos esta misma semana?',
    financial_stable: 'Tengo estabilidad financiera para los primeros meses',
    financial_needs_now: 'Necesito generar ingresos esta semana',

    // Step 12 — Pre-registration
    prereg_title: 'Pre-registro',
    prereg_description:
      'Tu evaluación está completa. Para enviarte el siguiente paso, necesito algunos datos adicionales.',
    prereg_email_label: 'Correo electrónico',
    prereg_age_label: 'Edad',
    prereg_age_placeholder: 'Ej: 28',
    prereg_marital_label: 'Estado civil',
    prereg_marital_single: 'Soltero/a',
    prereg_marital_married: 'Casado/a',
    prereg_marital_union: 'Unión libre',
    prereg_marital_divorced: 'Divorciado/a',

    // Step 13 — CV
    cv_title: 'Tu expediente',
    cv_description:
      'Último paso: para enviarte el enlace de entrevista necesitamos tu perfil.\nPuedes pegar tu URL de LinkedIn o subir tu CV directamente.',
    cv_tab_url: 'LinkedIn / URL',
    cv_tab_file: 'Subir archivo',
    cv_url_label: 'URL de LinkedIn o CV online',
    cv_url_placeholder: 'https://linkedin.com/in/tu-perfil',
    cv_drop_title: 'Arrastra tu archivo aquí o haz clic para seleccionar',
    cv_drop_types: 'PDF, DOC, DOCX, JPG, PNG, WEBP · Máx. 5 MB',
    cv_uploading: 'Subiendo archivo...',
    cv_uploaded_ok: 'Archivo subido correctamente',
    cv_upload_btn: 'Subir archivo →',
    cv_finish: 'Finalizar Evaluación →',
    cv_saving: 'Subiendo...',
    cv_confidential:
      'Tu información es confidencial y solo la verá el equipo de Magnetraffic',
    cv_error_url:
      'Por favor ingresa tu URL de LinkedIn o CV. Este es tu último intento.',
    cv_error_file: 'Selecciona y sube un archivo. Este es tu último intento.',
    cv_error_upload_first: 'Haz clic en "Subir archivo" primero.',

    // Result — Elite
    result_elite_badge: 'Perfil Élite',
    result_elite_subtitle: 'Evaluación completada · Resultado confidencial',
    result_elite_msg:
      '{name}, tienes uno de los perfiles más sólidos de esta convocatoria.\n\nEl equipo de liderazgo quiere conocerte directamente.',
    result_elite_next_title: 'Siguiente paso: Entrevista Prioritaria',
    result_elite_next_desc:
      'Sesión de 20 minutos con el Director del Proyecto.\nSelecciona el horario que mejor te funcione:',
    result_elite_cta: '📅 Agendar Mi Entrevista →',

    // Result — Calificado
    result_calificado_badge: 'Perfil Calificado',
    result_calificado_msg:
      '{name}, tu perfil encaja con lo que buscamos.\n\nEl siguiente paso es una llamada de 20 minutos con nuestro equipo.',
    result_calificado_card_title: 'Agenda tu entrevista',
    result_calificado_card_desc:
      'Escoge el horario que más te acomode para la llamada.',
    result_calificado_cta: '📅 Seleccionar Horario →',

    // Result — Potencial
    result_potencial_badge: 'En Revisión',
    result_potencial_completed: '{name}, evaluación completada.',
    result_potencial_desc:
      'Tienes bases sólidas, pero hay aspectos que el equipo de Dirección necesita revisar con más detalle.\n\nTe contactaremos en las próximas {hours} horas hábiles.',
    result_potencial_phone: 'Teléfono registrado:',

    // Result — Descartado
    result_descartado_badge: 'Evaluación Finalizada',
    result_descartado_msg: '{name}, completamos tu evaluación.',
    result_descartado_desc:
      'En este momento el perfil que buscamos requiere {reason}.\n\nEsto no significa que no tengas potencial — significa que el match exacto con este proyecto no está dado en este momento.\n\nTe deseamos mucho éxito.',

    // Disqualify reasons (used in result_descartado_desc)
    disq_rechazo_inicial: 'disposición para iniciar el proceso',
    disq_sin_disponibilidad: 'disponibilidad de tiempo completo',
    disq_sin_ventas_telefonicas: 'experiencia en ventas remotas',
    disq_sin_cierre_directo: 'experiencia en cierre directo de ventas',
    disq_sin_copywriting: 'habilidades de seguimiento activo',
    disq_sin_objeciones: 'técnicas de manejo de objeciones',
    disq_sin_runway: 'estabilidad durante el período de arranque',
    disq_no_envio_cv: 'documentación completa del perfil',
    disq_default: 'un match exacto con este proyecto',

    // Expired page
    expired_title: 'Sesión Expirada',
    expired_desc:
      'Tu sesión de evaluación ha expirado por inactividad.\n\nPor favor, contacta a tu reclutador para recibir un nuevo enlace de evaluación.',
  },

  en: {
    // General
    continue: 'Continue →',
    footer_confidential: 'Confidential process · Magnetraffic © 2025',
    footer_thanks: 'Thank you for your time',
    session_not_found: 'Session not found.',
    invalid_link: 'Invalid link. Please contact your recruiter.',

    // Evaluate — welcome
    welcome_subtitle: 'Remote Commercial Closer Evaluation',
    welcome_description:
      'This evaluation takes approximately 15-20 minutes. Answer honestly — we evaluate real judgment, not perfect answers. The process must be completed without interruptions.',
    welcome_badge_time: '⏱ 15-20 minutes',
    welcome_badge_nopause: '📱 No pauses',
    welcome_badge_unique: '🎯 One-time evaluation',
    welcome_start: 'Start Evaluation →',
    step_progress: 'Step {step} of {total}',

    // Step 0 — Consent
    consent_title: 'Before we begin',
    consent_greeting: 'Hi, I am the Magnetraffic evaluation system',
    consent_interest:
      'I see you were interested in the remote closer opportunity for the Hispanic market in the US.',
    consent_question:
      'We have a structured evaluation before the interview. Would you like to continue?',
    consent_yes: 'Yes, I want to continue',
    consent_no: 'No, thank you',

    // Step 1 — Basic Info
    basic_title: 'Basic information',
    basic_description:
      'Perfect, {name}. I need to confirm some details.\n\nWhat city and country are you writing from, and are you available to work full time (more than 30 hours per week)?',
    basic_location_label: 'City and country of residence',
    basic_location_placeholder: 'E.g.: Bogotá, Colombia',
    basic_availability_label: 'Weekly availability',
    basic_more30: 'More than 30 hours per week ✓',
    basic_less30: 'Less than 30 hours per week',

    // Step 2 — Experience
    exp_title: 'Your sales experience',
    exp_description:
      'Tell me about your sales experience: what did you sell, what digital tools did you use, and was closing done by phone/video or in person?',
    exp_placeholder: 'Describe your experience in as much detail as possible...',
    exp_hint: 'Be specific — this helps us understand your real profile',

    // Step 3 — Closing Role
    closing_title: 'Your closing role',
    closing_role_q:
      'In that experience, were you the one who closed the final sale and collected payment, or was your role more of a support?',
    closing_volume_q:
      'How many effective calls (with real prospects) did you make on a normal workday?',
    closing_role_1: 'Yes, I closed and collected directly',
    closing_role_2: 'I supported the close but was not the final decision-maker',
    closing_role_3: 'I only did demos or presentations',
    closing_role_4: 'I had no closing responsibility',
    closing_vol_1: '40 or more calls',
    closing_vol_2: 'Between 20 and 39 calls',
    closing_vol_3: 'Between 10 and 19 calls',
    closing_vol_4: 'Less than 10 calls',

    // Step 4 — Income
    income_title: 'Your results history',
    income_description:
      'How much did you earn in commissions in a good month? And tell me, how did that experience end?',
    income_label: 'Commission earnings (USD or equivalent)',
    income_exit_label: 'How did that experience end?',
    income_exit_placeholder: "Be honest, it's part of the evaluation...",

    // Step 5 — Reactivation
    react_title: 'Reactivation skill',
    react_description:
      "When a prospect ghosts you after showing interest, how do you reactivate them?\n\nWrite the REAL message you would send. Not the concept — the literal message.",
    react_placeholder: 'Write exactly what you would send...',
    react_chars: '{count} / 500 characters',

    // Step 6 — Objection
    objection_title: 'Objection handling',
    objection_setup: 'Imagine you are on a call with me and I say:',
    objection_quote: '💬 "I\'m interested, but it\'s too expensive"',
    objection_description:
      'What do you respond exactly? Write your answer as if you were on the call.',
    objection_placeholder: 'Your response on the call...',

    // Step 7 — Autonomy
    autonomy_title: 'Your work method',
    autonomy_description:
      'Working 100% remotely, how do you organize your sales day and pipeline without a boss supervising you?',
    autonomy_placeholder: 'Describe your real routine and system...',

    // Step 8 — Philosophy
    philo_title: 'Commercial judgment',
    philo_description:
      'A judgment question:\n\nWhat is more important for a successful closer?',
    philo_a_title: 'Converting a "no" into a "yes"',
    philo_a_desc: 'The ability to persuade the hesitant client',
    philo_b_title: 'Better pre-qualification',
    philo_b_desc: 'Reaching the ideal client faster and not wasting time',
    philo_c_title: 'Depends on the context',
    philo_c_desc: 'It depends on the context and type of sale',
    philo_explain_label: 'Briefly explain your answer',
    philo_explain_placeholder: 'Your reasoning...',

    // Step 9 — Verification
    verif_title: 'Data verification',
    verif_description:
      'Hey, checking my notes... I think you told me you made about {half} calls per day, right?',
    verif_correct: 'No, it was {calls} calls',
    verif_incorrect: "Yes, that's what I said",
    verif_almost: "We're on the home stretch. Two more questions and we're done.",

    // Step 10 — Stability
    stability_title: 'Professional background',
    stability_description:
      '{name}, how many different jobs or projects have you had in the last 3 years?',
    stability_1: '1 job or project',
    stability_2: '2 jobs or projects',
    stability_3: '3 or more jobs or projects',

    // Step 11 — Financial
    financial_title: 'Last question',
    financial_description:
      "For the project to work well from the start, I need to be direct with you:\n\nDo you have a stable financial base while you get started, or are you in a situation where you need income this very week?",
    financial_stable: 'I have financial stability for the first few months',
    financial_needs_now: 'I need to generate income this week',

    // Step 12 — Pre-registration
    prereg_title: 'Pre-registration',
    prereg_description:
      'Your evaluation is complete. To send you the next step, I need some additional information.',
    prereg_email_label: 'Email address',
    prereg_age_label: 'Age',
    prereg_age_placeholder: 'E.g.: 28',
    prereg_marital_label: 'Marital status',
    prereg_marital_single: 'Single',
    prereg_marital_married: 'Married',
    prereg_marital_union: 'Common-law partner',
    prereg_marital_divorced: 'Divorced',

    // Step 13 — CV
    cv_title: 'Your profile',
    cv_description:
      'Last step: to send you the interview link, we need your profile.\nYou can paste your LinkedIn URL or upload your CV directly.',
    cv_tab_url: 'LinkedIn / URL',
    cv_tab_file: 'Upload file',
    cv_url_label: 'LinkedIn or online CV URL',
    cv_url_placeholder: 'https://linkedin.com/in/your-profile',
    cv_drop_title: 'Drag your file here or click to select',
    cv_drop_types: 'PDF, DOC, DOCX, JPG, PNG, WEBP · Max. 5 MB',
    cv_uploading: 'Uploading file...',
    cv_uploaded_ok: 'File uploaded successfully',
    cv_upload_btn: 'Upload file →',
    cv_finish: 'Finish Evaluation →',
    cv_saving: 'Uploading...',
    cv_confidential:
      'Your information is confidential and will only be seen by the Magnetraffic team',
    cv_error_url: 'Please enter your LinkedIn or CV URL. This is your last attempt.',
    cv_error_file: 'Select and upload a file. This is your last attempt.',
    cv_error_upload_first: 'Click "Upload file" first.',

    // Result — Elite
    result_elite_badge: 'Elite Profile',
    result_elite_subtitle: 'Evaluation completed · Confidential result',
    result_elite_msg:
      "{name}, you have one of the strongest profiles in this opening.\n\nThe leadership team wants to meet you directly.",
    result_elite_next_title: 'Next step: Priority Interview',
    result_elite_next_desc:
      '20-minute session with the Project Director.\nSelect the time that works best for you:',
    result_elite_cta: '📅 Schedule My Interview →',

    // Result — Calificado
    result_calificado_badge: 'Qualified Profile',
    result_calificado_msg:
      "{name}, your profile matches what we're looking for.\n\nThe next step is a 20-minute call with our team.",
    result_calificado_card_title: 'Schedule your interview',
    result_calificado_card_desc:
      'Choose the time that works best for you for the call.',
    result_calificado_cta: '📅 Select a Time Slot →',

    // Result — Potencial
    result_potencial_badge: 'Under Review',
    result_potencial_completed: '{name}, evaluation completed.',
    result_potencial_desc:
      'You have a solid foundation, but there are aspects the Leadership team needs to review in more detail.\n\nWe will contact you within the next {hours} business hours.',
    result_potencial_phone: 'Registered phone:',

    // Result — Descartado
    result_descartado_badge: 'Evaluation Completed',
    result_descartado_msg: "{name}, we've completed your evaluation.",
    result_descartado_desc:
      "At this time the profile we're looking for requires {reason}.\n\nThis does not mean you lack potential — it means the exact match for this project is not there right now.\n\nWe wish you great success.",

    // Disqualify reasons
    disq_rechazo_inicial: 'willingness to start the process',
    disq_sin_disponibilidad: 'full-time availability',
    disq_sin_ventas_telefonicas: 'remote sales experience',
    disq_sin_cierre_directo: 'direct sales closing experience',
    disq_sin_copywriting: 'active follow-up skills',
    disq_sin_objeciones: 'objection handling techniques',
    disq_sin_runway: 'financial stability during the ramp-up period',
    disq_no_envio_cv: 'complete profile documentation',
    disq_default: 'an exact match for this project',

    // Expired page
    expired_title: 'Session Expired',
    expired_desc:
      'Your evaluation session has expired due to inactivity.\n\nPlease contact your recruiter to receive a new evaluation link.',
  },
} as const;

export type TranslationKey = keyof typeof translations.es;

export default translations;

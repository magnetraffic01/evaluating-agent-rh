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
    welcome_subtitle: '🎯 Closer Comercial Remoto · Full-time',
    welcome_description:
      'Para llegar a la entrevista, primero queremos conocerte con una evaluación corta.',
    welcome_badge_time: 'Vendedor independiente · Mercado hispano en EE.UU.',
    welcome_badge_nopause: '15 min · Tus respuestas se guardan automáticamente',
    welcome_badge_unique: '',
    welcome_start: 'Comenzar →',
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
      '¿Cuál era tu PROMEDIO mensual de comisiones (no el mejor mes — el promedio real)? Y cuéntame, ¿cómo terminó esa etapa?',
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
    stability_3_4: '3 a 4 trabajos o proyectos',
    stability_5_plus: '5 o más trabajos o proyectos',

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

    // Loader LLM (overlay durante scoring async ~8s)
    llm_analyzing_title: 'Analizando tu respuesta…',
    llm_analyzing_subtitle: 'Estamos evaluando con IA. Tarda unos segundos.',

    // ─── Trebolife specific ──────────────────────────────────────────────────
    basic_more40: 'Sí, tengo 40+ horas semanales disponibles ✓',
    basic_less40: 'No, tengo menos de 40 horas',
    basic_email_label: 'Correo electrónico',
    basic_email_placeholder: 'tu@email.com',
    basic_language_label: '¿En qué idioma cierras mejor con clientes hispanos en EE.UU.?',
    basic_language_es_only: 'Solo español',
    basic_language_bilingual: 'Español + inglés (puedo cerrar en ambos)',

    // FASE 10 — InboundOpen (slot step 8 reusado para trebolife/traduce)
    inbound_title: 'Apertura de llamada inbound',
    inbound_description:
      'Imagina que recibís una llamada inbound: una persona dejó sus datos online interesada en el **Servicio de Bienestar Familiar** — membresía mensual de $29 con descuentos médicos y dentales para toda la familia. Se conecta. Vos sos quien atiende.\n\n¿Qué decís en los **primeros 60 segundos** de la llamada? Escribilo literal, como si lo estuvieras diciendo.',
    inbound_placeholder: 'Hola, gracias por interesarte... — escribilo literal',
    inbound_chars: '{count} / 600 caracteres',

    // FASE 10 — CV: pestaña Loom adicional
    cv_tab_loom: 'Video Loom (60s)',
    cv_loom_label: 'URL de tu video Loom',
    cv_loom_placeholder: 'https://www.loom.com/share/...',
    cv_loom_help: 'Grabá un video de 60s presentándote y vendiendo el Servicio de Bienestar Familiar como si fuera real. Pegá la URL pública aquí.',
    cv_loom_invalid: 'La URL debe ser de loom.com',
    basic_description_trebolife:
      'Hola {name}. Para closer de Trebolife necesitamos confirmar 3 cosas:\n\n• Desde dónde nos escribes\n• Tu correo (para enviarte la información del proceso)\n• Que tengas 40+ horas semanales reales (la cuota mínima es 5 ventas/día)',

    exp_description_trebolife:
      'En Trebolife vendes seguros de salud accesibles ($14-$45/mes) por suscripción.\n\nCuéntame:\n• ¿Has cerrado SUSCRIPCIONES recurrentes (seguros, telecom, gym, software)?\n• ¿Cuánto duraba en promedio tu cliente sin cancelar?\n• ¿Vendiste a familias hispanas en EE.UU. antes?',

    objection_setup_trebolife:
      'Estás vendiendo el Servicio de Bienestar Familiar ($29/mes — descuentos médicos y dentales para la familia). El prospecto te dice:',
    objection_quote_trebolife:
      '💬 "Mira, agradezco la llamada pero ya tengo mi seguro y no necesito otra cosa más"',
    objection_description_trebolife:
      '¿Qué le respondés exactamente? Como si estuvieras en la llamada — las palabras literales, no el concepto.',

    // Step 11 — Ramp-up (Trebolife)
    ramp_title: 'Velocidad de arranque',
    ramp_description:
      'En Trebolife un closer competente cierra ~5 ventas/día.\n\n• Mes 1 = $1,100\n• Mes 2 = $2,090\n• Mes 6 = $6,050\n• Mes 12 = $11,900\n\n¿En qué semana esperas estar cerrando 5 ventas al día de forma sostenida?',
    ramp_week_1_2: 'Semana 1-2 (cierro rápido, ya tengo el método)',
    ramp_week_3_4: 'Semana 3-4 (necesito calibrar el script y conocer el producto)',
    ramp_month_2: 'Mes 2 (necesito un mes completo de práctica)',
    ramp_month_3_plus: 'Mes 3 o más (necesito tiempo para aprender desde cero)',

    // Step 12 — Churn resistance (Trebolife)
    churn_title: 'Cierre con FIT vs cierre con presión',
    churn_scenario:
      'Cerraste a María una membresía del Servicio de Bienestar Familiar ($29/mes). Pagó el primer mes. Antes del segundo cobro cancela diciendo: "no lo estoy usando, no me sirve".',
    churn_question:
      '¿Qué hubieras hecho DISTINTO en la llamada inicial para que María llegara feliz al mes 6? Sé concreto: ¿qué pregunta no le hiciste? ¿qué expectativa no aclaraste? ¿qué le prometiste de más?',
    churn_placeholder:
      'Ej: en la llamada no le pregunté qué descuentos usaría primero. Sin saber qué necesidad real cubría...',
    churn_hint: 'Esta respuesta la lee la reclutadora — sé honesto, no genérico.',

    // ─── Portal (FASE 6 i18n) ──────────────────────
    // Login
    portal_title: 'Portal de Reclutadora',
    portal_login_subtitle: 'Acceso restringido · Magnetraffic',
    portal_login_email_placeholder: 'tu@email.com',
    portal_login_password_placeholder: 'Contraseña',
    portal_login_btn_loading: 'Accediendo...',
    portal_login_btn: 'Acceder',
    portal_login_error_empty: 'Por favor ingresa tu email y contraseña.',
    portal_login_error_credentials: 'Credenciales incorrectas. Verifica tu email y contraseña.',
    portal_login_error_generic: 'Error al iniciar sesión.',

    // Header / nav
    portal_header_title: 'Portal Reclutador',
    portal_btn_refresh: 'Actualizar',
    portal_btn_logout: 'Salir',
    portal_recruiter_fallback: 'Reclutador',

    // Stats cards
    portal_stat_my_candidates: 'Mis Candidatos',
    portal_stat_scheduled: 'Agendados',
    portal_stat_elite: 'Elite',
    portal_stat_qualified: 'Calificados',
    portal_stat_potential: 'Potenciales',

    // Recruiter metrics dashboard
    metrics_range_today: 'Hoy',
    metrics_range_7d: '7 días',
    metrics_range_30d: '30 días',
    metrics_range_all: 'Todo',
    metrics_kpi_candidates: 'Mis candidatos',
    metrics_kpi_scheduled: 'Agendadas',
    metrics_kpi_interviewed: 'Entrevistados',
    metrics_kpi_hired: 'Contratados',
    metrics_kpi_hire_rate: 'Tasa de éxito',
    metrics_kpi_no_shows: 'No asistieron',
    metrics_funnel_title: 'Tu funnel de cierre',
    metrics_funnel_assigned: 'Asignados',
    metrics_funnel_scheduled: 'Agendados',
    metrics_funnel_interviewed: 'Entrevistados',
    metrics_funnel_hired: 'Contratados',
    metrics_funnel_vs_prev: '{percent}% vs etapa previa',
    metrics_company_title: 'Distribución por empresa',
    metrics_company_trebolife: 'Trebolife',
    metrics_company_traduce: 'Traduce',
    metrics_company_unassigned: 'Sin empresa',
    metrics_trend_title: 'Tendencia 14 días',
    metrics_trend_total: 'Total: {n}',
    metrics_trend_avg: 'Promedio: {n}/día',
    metrics_empty: 'Sin datos en este rango',

    // Insights — Pendientes accionables
    insights_pending_title: 'Pendientes accionables del día',
    insights_pending_urgent: 'Urgentes',
    insights_pending_followup: 'Próximas entrevistas (48h)',
    insights_pending_no_contact: 'Recién asignados (<24h)',
    insights_pending_assigned_ago: 'Asignado hace {hours}h sin agendar',
    insights_pending_in_hours: 'En {hours}h',
    insights_pending_received_ago: 'hace {hours}h',
    insights_pending_empty: 'Nada pendiente acá',
    // Insights — Calidad de leads
    insights_quality_title: 'Calidad de tus leads',
    insights_quality_team: 'equipo',
    insights_quality_empty: 'Aún sin candidatos asignados.',
    // Insights — Velocidad
    insights_velocity_title: 'Velocidad del closer',
    insights_velocity_to_schedule: 'Asignación → Agendada',
    insights_velocity_to_hire: 'Agendada → Contratado',
    insights_velocity_avg_score: 'Score promedio de tus hires',
    insights_velocity_team: 'equipo: {value}',
    insights_velocity_faster: '{percent}% más rápido',
    insights_velocity_slower: '{percent}% más lento',
    insights_velocity_empty: 'Aún no tienes entrevistas agendadas para medir velocidad.',
    // Insights — Perfil de cierres
    insights_breakdown_title: 'Perfil de tus cierres',
    insights_breakdown_bucket_elite: '110+ pts (Elite)',
    insights_breakdown_bucket_calificado: '90-109 pts',
    insights_breakdown_bucket_potencial: '80-89 pts',
    insights_breakdown_insight_elite: 'Tus hires son mayormente Elite ({n}/{total}). Vendés mejor a leads premium.',
    insights_breakdown_insight_calificado: 'Cierras bien los Calificado ({n}/{total}). Tu fuerte está en el rango medio.',
    insights_breakdown_insight_mixed: 'Cierras parejo en todos los niveles. Versátil.',
    insights_breakdown_insight_empty: 'Aún no tienes hires registrados. Cuando empieces a contratar, acá verás el patrón.',

    // Gamification (FASE 9)
    gamification_leaderboard_title: 'Ranking del mes',
    gamification_leaderboard_empty: 'Aún sin hires este mes — sé el primero ⭐',
    gamification_leaderboard_you: 'Tú',
    gamification_leaderboard_you_position: 'Tú: posición #{position} de {total}',
    gamification_leaderboard_of_goal: '{count} de {goal}',
    gamification_streak_title: 'Tu racha',
    gamification_streak_days: 'días seguidos cerrando',
    gamification_streak_day_singular: 'día seguido cerrando',
    gamification_streak_zero: 'Sin racha activa',
    gamification_streak_best: 'Tu mejor racha: {days} días',
    gamification_streak_last_hire: 'Último cierre: hace {days} días',
    gamification_streak_last_hire_today: 'Último cierre: hoy',
    gamification_streak_admin_only: 'Solo visible para reclutadores',
    gamification_projection_title: 'Objetivo del mes',
    gamification_projection_above: '📈 Vas para {projected} — superas el objetivo de {goal}',
    gamification_projection_match: '📊 Vas exacto en objetivo: {projected}',
    gamification_projection_below: '⚠️ Al ritmo actual cerrarías {projected} de {goal}. Te falta acelerar.',
    gamification_projection_day: 'Día {day} de {total} del mes',
    gamification_projection_marker: 'proyección',

    // Status labels (badge)
    portal_status_elite: 'ELITE',
    portal_status_calificado: 'CALIFICADO',
    portal_status_potencial: 'POTENCIAL',
    portal_status_descartado: 'DESCARTADO',
    portal_status_en_progreso: 'EN PROGRESO',

    // Interview status labels
    portal_interview_agendada: 'Agendada',
    portal_interview_entrevistado: 'Entrevistado',
    portal_interview_no_asistio: 'No asistió',
    portal_interview_reprogramado: 'Reprogramado',
    portal_interview_rechazado_post: 'Rechazado post-entrevista',

    // Filters
    portal_search_placeholder: 'Buscar por nombre o teléfono...',
    portal_filter_all: 'Todos los estados',
    portal_filter_elite: 'Elite',
    portal_filter_calificado: 'Calificado',
    portal_filter_potencial: 'Potencial',
    portal_filter_descartado: 'Descartado',
    portal_filter_en_progreso: 'En progreso',
    portal_btn_clear: 'Limpiar',

    // Totalizador
    portal_candidate_singular: 'candidato',
    portal_candidate_plural: 'candidatos',
    portal_of_total: 'de {total}',
    portal_filter_active: 'filtro activo',

    // Table headers
    portal_col_name: 'Nombre',
    portal_col_phone: 'Teléfono',
    portal_col_location: 'Ubicación',
    portal_col_score: 'Score',
    portal_col_result: 'Resultado',
    portal_col_interview: 'Entrevista',
    portal_col_date: 'Fecha',

    // Table states
    portal_loading_candidates: 'Cargando candidatos...',
    portal_empty_candidates: 'No hay candidatos que coincidan',

    // Footer
    portal_footer: '{filtered} de {total} candidatos · Magnetraffic HR',

    // Config panel
    portal_config_title: 'Mi Configuración',
    portal_config_name: 'Nombre',
    portal_config_label: 'Label',
    portal_config_total_assigned: 'Asignados totales',
    portal_config_calendar_url: 'URL del calendario',
    portal_btn_copied: 'Copiado',
    portal_btn_copy_link: 'Copiar enlace',

    // Modal — candidate detail
    portal_modal_loading: 'Cargando datos completos...',
    portal_modal_phone: 'Teléfono',
    portal_modal_email: 'Email',
    portal_modal_location: 'Ubicación',
    portal_modal_interview_status: 'Estado entrevista',
    portal_modal_interview_date: 'Fecha entrevista',
    portal_modal_eval_date: 'Fecha evaluación',
    portal_modal_llm_title: 'Respuestas LLM-evaluadas',
    portal_modal_notes_title: 'Notas',

    // ─── Admin (FASE 6 i18n) ──────────────────────
    // Login
    admin_login_title: 'Panel de Administración',
    admin_login_subtitle: 'Acceso restringido · Magnetraffic',
    admin_login_email_placeholder: 'tu@email.com',
    admin_login_password_placeholder: 'Contraseña',
    admin_login_btn: 'Acceder al Panel',
    admin_login_btn_loading: 'Validando...',
    admin_login_error_empty: 'Ingresa tu email y contraseña.',
    admin_login_error_credentials: 'Credenciales incorrectas.',
    admin_login_error_generic: 'Error al iniciar sesión.',

    // Header
    admin_btn_refresh: 'Actualizar',
    admin_btn_logout: 'Salir',

    // Tabs
    admin_tab_candidates: 'Candidatos',
    admin_tab_recruiters: 'Reclutadores',
    admin_tab_companies: 'Empresas',
    admin_tab_analytics: 'Analytics',

    // Status labels (STATUS_CONFIG)
    admin_status_elite: 'ELITE',
    admin_status_calificado: 'CALIFICADO',
    admin_status_potencial: 'POTENCIAL',
    admin_status_descartado: 'DESCARTADO',
    admin_status_en_progreso: 'EN PROGRESO',

    // Interview status labels (INTERVIEW_STATUS_CONFIG)
    admin_interview_agendada: 'Agendada',
    admin_interview_entrevistado: 'Entrevistado',
    admin_interview_no_asistio: 'No asistió',
    admin_interview_reprogramado: 'Reprogramado',
    admin_interview_rechazado_post: 'Rechazado post-entrevista',

    // Score labels (SCORE_LABELS)
    admin_score_label_E1_cierre: 'Cierre directo',
    admin_score_label_E1_volumen: 'Volumen llamadas',
    admin_score_label_E3_copywriting: 'Copywriting',
    admin_score_label_E4_objeciones: 'Objeciones',
    admin_score_label_E5_autonomia: 'Autonomía',
    admin_score_label_E6_filosofia: 'Filosofía de ventas',
    admin_score_label_C1_estabilidad: 'Estabilidad laboral',
    admin_score_label_V1_penalty: 'Penalización consistencia',
    admin_score_label_E2_penalty: 'Penalización narrativa',

    // Filters
    admin_search_placeholder: 'Buscar por nombre, teléfono o email...',
    admin_filter_all_statuses: 'Todos los estados',
    admin_filter_elite: 'Elite',
    admin_filter_calificado: 'Calificado',
    admin_filter_potencial: 'Potencial',
    admin_filter_descartado: 'Descartado',
    admin_filter_en_progreso: 'En progreso',
    admin_filter_all_recruiters: 'Todos los reclutadores',
    admin_filter_today: 'Hoy',
    admin_filter_yesterday: 'Ayer',
    admin_filter_this_week: 'Esta semana',
    admin_filter_this_month: 'Este mes',
    admin_btn_clear_dates: 'Limpiar',

    // Stats cards
    admin_stat_total: 'Total',
    admin_stat_today: 'Hoy',
    admin_stat_qualified: 'Calificados',
    admin_stat_discarded: 'Descartados',
    admin_stat_avg_duration: 'Duración prom.',

    // Totalizador
    admin_count_evaluation_singular: 'evaluación',
    admin_count_evaluation_plural: 'evaluaciones',
    admin_count_of: 'de {total}',
    admin_filter_active: 'filtro activo',

    // Table headers
    admin_col_name: 'Nombre',
    admin_col_phone: 'Teléfono',
    admin_col_location: 'Ubicación',
    admin_col_score: 'Score',
    admin_col_result: 'Resultado',
    admin_col_recruiter: 'Reclutador',
    admin_col_interview: 'Entrevista',
    admin_col_date: 'Fecha',

    // Table states
    admin_loading_evaluations: 'Cargando evaluaciones...',
    admin_empty_evaluations: 'No hay evaluaciones que coincidan',
    admin_error_loading: 'Error al cargar datos: {error}',
    admin_btn_retry: 'Reintentar',

    // Table action
    admin_btn_view: 'Ver →',

    // Footer
    admin_footer: '{filtered} de {total} evaluaciones · Magnetraffic HR',

    // Modal tabs
    admin_modal_tab_candidate: 'Candidato',
    admin_modal_tab_summary: 'Resumen',
    admin_modal_tab_answers: 'Respuestas',
    admin_modal_tab_score: 'Evaluación',
    admin_modal_tab_interview: 'Entrevista',

    // Modal — candidate tab
    admin_modal_loading_detail: 'Cargando detalle completo...',
    admin_modal_llm_responses_title: 'Respuestas LLM-evaluadas',
    admin_modal_print_btn: 'Imprimir / PDF',

    // Modal — resume tab
    admin_modal_candidate_data_title: 'Datos del Candidato',
    admin_modal_profile_summary_title: 'Resumen del Perfil',
    admin_modal_exit_reason_title: 'Razón de salida del último trabajo',
    admin_modal_best_reactivation_title: 'Mejor Mensaje de Reactivación',

    // Modal — resume tab candidate fields
    admin_modal_field_phone: 'Teléfono',
    admin_modal_field_email: 'Email',
    admin_modal_field_location: 'Ubicación',
    admin_modal_field_age: 'Edad',
    admin_modal_field_marital: 'Estado civil',
    admin_modal_field_calls_day: 'Llamadas/día',
    admin_modal_field_last_income: 'Último ingreso',
    admin_modal_field_eval_date: 'Evaluación',

    // Modal — QA tab
    admin_modal_qa_title: 'Preguntas y Respuestas',
    admin_modal_qa_empty: 'Esta evaluación no tiene respuestas detalladas guardadas.\nLas respuestas completas se guardan a partir de hoy en evaluaciones nuevas.',

    // Modal — score tab
    admin_modal_score_breakdown_title: 'Desglose de Score',
    admin_modal_score_criteria_title: 'Criterios Aplicados',
    admin_modal_score_flags_title: 'Flags Detectados',
    admin_modal_score_discard_title: 'Razón de Descarte',

    // Modal — interview tab
    admin_modal_interview_title: 'Gestión de Entrevista',
    admin_modal_interview_recruiter_label: 'Reclutador asignado',
    admin_modal_interview_recruiter_placeholder: 'Nombre del reclutador...',
    admin_modal_interview_unassigned: 'Sin asignar',
    admin_modal_interview_status_label: 'Estado de la entrevista',
    admin_modal_interview_no_status: '— Sin estado —',
    admin_modal_interview_print_no_status: 'Sin estado',
    admin_modal_interview_date_label: 'Fecha de entrevista',
    admin_modal_interview_no_date: 'Sin fecha asignada',
    admin_modal_interview_notes_label: 'Notas del reclutador',
    admin_modal_interview_notes_placeholder: 'Observaciones post-entrevista, impresiones, próximos pasos...',
    admin_modal_saving: 'Guardando...',
    admin_modal_save_error: 'Error al guardar: {error}',

    // Recruiter panel
    admin_recruiter_weights_label: 'Suma de pesos activos:',
    admin_recruiter_weights_over: '(¡supera 100%!)',
    admin_recruiter_col_name: 'Nombre',
    admin_recruiter_col_label: 'Label',
    admin_recruiter_col_calendar: 'Calendario',
    admin_recruiter_col_weight: 'Peso %',
    admin_recruiter_col_total: 'Total Asig.',
    admin_recruiter_col_real_pct: '% Real',
    admin_recruiter_col_status: 'Estado',
    admin_recruiter_col_distribution: 'Distribución',
    admin_recruiter_col_actions: 'Acciones',
    admin_recruiter_active: 'Activo',
    admin_recruiter_inactive: 'Inactivo',
    admin_recruiter_btn_save: 'Guardar',
    admin_recruiter_btn_cancel: 'Cancelar',
    admin_recruiter_btn_edit: 'Editar',
    admin_recruiter_empty: 'No hay reclutadores configurados aún.',
    admin_recruiter_btn_add: '+ Agregar reclutador',
    admin_recruiter_add_title: 'Nuevo reclutador',
    admin_recruiter_add_error_required: 'Nombre, label y URL del calendario son requeridos.',
    admin_recruiter_field_name_label: 'Nombre',
    admin_recruiter_field_name_placeholder: 'Ej: María González',
    admin_recruiter_field_label_label: 'Label',
    admin_recruiter_field_label_placeholder: 'Ej: Reclutador 3',
    admin_recruiter_field_calendar_label: 'URL del calendario',
    admin_recruiter_field_weight_label: 'Peso %',

    // Company assignment section
    admin_company_assignment_title: 'Asignación por Empresa',

    // ─── Performance tab (admin) ────────────────────────────────────────────
    admin_tab_performance: 'Rendimiento',
    admin_perf_title: 'Rendimiento del equipo',
    admin_perf_podium_title: 'Top 3 del mes',
    admin_perf_podium_empty: 'Aún no hay hires este mes — el podio se llenará cuando se registren los primeros cierres.',
    admin_perf_x_of_y: '{count} de {goal}',
    admin_perf_quick_actions: 'Acciones rápidas',
    admin_perf_btn_view_abandoned: 'Ver candidatos abandonados ({count})',
    admin_perf_jump_abandoned_toast: 'Saltando a la sección de abandonados…',
    admin_perf_comparison_title: 'Comparativa por reclutadora',
    admin_perf_col_recruiter: 'Reclutadora',
    admin_perf_col_companies: 'Empresas',
    admin_perf_col_hires_mes: 'Hires mes',
    admin_perf_col_goal: 'Goal',
    admin_perf_col_hire_rate: 'Hire-rate',
    admin_perf_col_assign_to_schedule: 'Avg asig→agend',
    admin_perf_col_schedule_to_hire: 'Avg agend→hired',
    admin_perf_col_lead_quality: 'Lead quality',
    admin_perf_col_streak: 'Streak',
    admin_perf_sin_data: 'No hay datos de reclutadores activos.',
    admin_perf_recruiters_count: '{count} reclutadoras activas',

    // ─── Recruiter goal (inline edit) ───────────────────────────────────────
    admin_recruiter_goal_label: 'Goal mensual',
    admin_recruiter_goal_updated: 'Goal actualizado para {name}',

    // ─── Modal — Q&A FASE 10 + Loom ─────────────────────────────────────────
    admin_qa_inbound_title: 'Apertura de llamada inbound',
    admin_qa_language_title: 'Idioma de cierre',
    admin_qa_lang_es_only: 'Solo español',
    admin_qa_lang_bilingual: 'Bilingüe (ES/EN)',
    admin_modal_loom_btn: 'Ver video Loom (60s)',

    // ─── Analytics panel ────────────────────────────────────────────────────
    admin_analytics_title: 'Analytics del Funnel',
    admin_analytics_company_all: 'Todas',
    admin_analytics_range_today: 'Hoy',
    admin_analytics_range_7d: '7d',
    admin_analytics_range_30d: '30d',
    admin_analytics_range_all: 'Todo',
    admin_analytics_temporal_tooltip: 'Rango temporal — se aplica al funnel global y a abandonados',
    admin_analytics_temporal_note: 'Filtros temporales próximamente para el funnel global. Por ahora la sección "abandonados" sí los aplica en vivo.',
    admin_analytics_error: 'No se pudo cargar analytics: {error}',
    admin_analytics_loading: 'Cargando analytics...',
    admin_analytics_no_data: 'Sin datos de analytics disponibles',
    admin_analytics_kpi_total: 'Total evaluaciones',
    admin_analytics_kpi_completed: 'Completadas',
    admin_analytics_kpi_conversion: 'Conversión (elite+cal.)',
    admin_analytics_kpi_in_progress: 'En progreso',
    admin_analytics_of_total: 'del total',
    admin_analytics_of_completed: 'de completadas',
    admin_analytics_funnel_title: 'Abandono por Step',
    admin_analytics_by_status: 'Por Resultado',
    admin_analytics_by_device: 'Por Dispositivo',
    admin_analytics_avg_step_title: 'Tiempo promedio por step (segundos)',

    // ─── Abandoned section ──────────────────────────────────────────────────
    admin_abandoned_title: 'Candidatos abandonados (≥ {hours}h)',
    admin_abandoned_hours: 'Horas:',
    admin_abandoned_reactivate: 'Reactivar',
    admin_abandoned_empty: 'Nadie abandonado en esa ventana ✓',
    admin_abandoned_col_name: 'Nombre',
    admin_abandoned_col_phone: 'Teléfono',
    admin_abandoned_col_step: 'Step',
    admin_abandoned_col_inactive: 'Inactivo hace',

    // ─── Export ─────────────────────────────────────────────────────────────
    admin_export_csv: 'Exportar CSV',

    // ─── Traduce specific ───────────────────────────────────────────────────
    basic_description_traduce:
      'Hola {name}. Para closer de Traduce necesitamos confirmar 3 cosas:\n\n• Desde dónde nos escribes\n• Tu correo (para enviarte la información del proceso)\n• Que tengas 40+ horas semanales reales (los clientes migrantes requieren mucho seguimiento)',

    exp_description_traduce:
      'En Traduce vendés traducciones certificadas ($14-$120/orden) para trámites migratorios (USCIS, DMV, cortes, escuelas).\n\nCuéntame:\n• ¿Has trabajado con clientes que requieren 5-10 contactos antes de comprar (tipo trámite o migración)?\n• ¿Cuánto tiempo en promedio tardabas en cerrar ese tipo de lead?\n• ¿Has vendido a familias hispanas en EE.UU. antes?\n\nY dame un ejemplo concreto: cliente llama pidiendo 1 página por $14 — ¿cómo lo subís a un paquete de $80-120 sin presionar?',

    react_description_traduce:
      'Cliente pidió cotización hace 1 mes y no ha respondido más.\n\nEscríbeme el mensaje REAL que le mandarías el día de hoy para reactivarlo. No el concepto — el mensaje literal que le enviarías por WhatsApp o email.',

    objection_setup_traduce:
      'Estás vendiendo el Servicio de Bienestar Familiar ($29/mes — descuentos médicos y dentales para la familia). El prospecto te dice:',
    objection_quote_traduce:
      '💬 "Mira, agradezco la llamada pero ya tengo mi seguro y no necesito otra cosa más"',
    objection_description_traduce:
      '¿Qué le respondés exactamente? Como si estuvieras en la llamada — las palabras literales, no el concepto.',

    autonomy_description_traduce:
      'Trabajando 100% en remoto con 80+ leads activos en distintas etapas (algunos pidieron cotización, otros dijeron "después", otros llevan semanas sin responder), ¿cómo organizás tu pipeline para no perder a ninguno?',

    // Step 11 — Ramp-up (Traduce)
    ramp_title_traduce: 'Velocidad de arranque',
    ramp_description_traduce:
      'En Traduce el ticket promedio es $100/orden con 5% de comisión (~$5/venta) más bonos de retención.\n\n• Mes 1 estimado = $300-500\n• Mes 3 con retorno de clientes = $800-1,200\n• Mes 6 con referidos activos = $1,500+\n\nEn tu último trabajo, ¿en qué semana llegaste a tu cuota? ¿Cuánto tardabas en cerrar el lead promedio?',
    ramp_week_1_2_traduce: 'Semana 1-2 (cierro rápido, ya tengo el método de seguimiento)',
    ramp_week_3_4_traduce: 'Semana 3-4 (necesito entender el producto y calibrar mi pitch)',
    ramp_month_2_traduce: 'Mes 2 (necesito un mes completo de práctica y feedback)',
    ramp_month_3_plus_traduce: 'Mes 3 o más (necesito tiempo para aprender desde cero)',

    // Step 12 — Retention (Traduce — reusa el producto simulado)
    churn_title_traduce: 'Cierre con FIT vs cierre con presión',
    churn_scenario_traduce:
      'Cerraste a María una membresía del Servicio de Bienestar Familiar ($29/mes). Pagó el primer mes. Antes del segundo cobro cancela diciendo: "no lo estoy usando, no me sirve".',
    churn_question_traduce:
      '¿Qué hubieras hecho DISTINTO en la llamada inicial para que María llegara feliz al mes 6? Sé concreto: ¿qué pregunta no le hiciste? ¿qué expectativa no aclaraste? ¿qué le prometiste de más?',
    churn_placeholder_traduce:
      'Ej: en la llamada no le pregunté qué descuentos usaría primero. Sin saber qué necesidad real cubría...',
  },

  en: {
    // General
    continue: 'Continue →',
    footer_confidential: 'Confidential process · Magnetraffic © 2025',
    footer_thanks: 'Thank you for your time',
    session_not_found: 'Session not found.',
    invalid_link: 'Invalid link. Please contact your recruiter.',

    // Evaluate — welcome
    welcome_subtitle: '🎯 Remote Commercial Closer · Full-time',
    welcome_description:
      'Before the interview, we\'d like to get to know you with a short evaluation.',
    welcome_badge_time: 'Independent contractor · US Hispanic market',
    welcome_badge_nopause: '15 min · Your answers are saved automatically',
    welcome_badge_unique: '',
    welcome_start: 'Start →',
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
      'What was your AVERAGE monthly commission (not the best month — the real average)? And tell me, how did that role end?',
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
    stability_3_4: '3 to 4 jobs or projects',
    stability_5_plus: '5 or more jobs or projects',

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

    // Loader LLM (overlay during async scoring ~8s)
    llm_analyzing_title: 'Analyzing your answer…',
    llm_analyzing_subtitle: 'Our AI is evaluating it. Takes a few seconds.',

    // ─── Trebolife specific ──────────────────────────────────────────────────
    basic_more40: 'Yes, I have 40+ hours available per week ✓',
    basic_less40: 'No, I have less than 40 hours',
    basic_email_label: 'Email address',
    basic_email_placeholder: 'you@email.com',
    basic_language_label: 'Which language do you close best with US Hispanic clients?',
    basic_language_es_only: 'Spanish only',
    basic_language_bilingual: 'Spanish + English (I can close in both)',

    // FASE 10 — InboundOpen (step slot 8 reused for trebolife/traduce)
    inbound_title: 'Inbound call opening',
    inbound_description:
      'Imagine you receive an inbound call: someone left their info online interested in the **Family Wellness Service** — $29/month membership for medical and dental discounts for the whole family. They get on the line. You answer.\n\nWhat do you say in the **first 60 seconds** of the call? Write it literally, as if you were saying it.',
    inbound_placeholder: 'Hi, thanks for your interest... — write it literally',
    inbound_chars: '{count} / 600 characters',

    // FASE 10 — CV: additional Loom tab
    cv_tab_loom: 'Loom video (60s)',
    cv_loom_label: 'Your Loom video URL',
    cv_loom_placeholder: 'https://www.loom.com/share/...',
    cv_loom_help: 'Record a 60s video introducing yourself and selling the Family Wellness Service as if it were real. Paste the public URL here.',
    cv_loom_invalid: 'The URL must be from loom.com',
    basic_description_trebolife:
      "Hi {name}. To be a Trebolife closer we need to confirm 3 things:\n\n• Where you're writing from\n• Your email (so we can send you process info)\n• That you actually have 40+ hours per week (minimum quota is 5 sales/day)",

    exp_description_trebolife:
      'At Trebolife you sell accessible health insurance ($14-$45/mo) on a subscription basis.\n\nTell me:\n• Have you closed RECURRING subscriptions (insurance, telecom, gym, software)?\n• On average, how long did your client stay before cancelling?\n• Have you sold to Hispanic families in the US before?',

    objection_setup_trebolife:
      "You're selling the Family Wellness Service ($29/mo — medical and dental discounts for the family). The prospect tells you:",
    objection_quote_trebolife:
      "💬 \"Look, I appreciate the call but I already have my insurance and I don't need anything else\"",
    objection_description_trebolife:
      'What do you respond exactly? As if you were on the call — the literal words, not the concept.',

    ramp_title: 'Ramp-up speed',
    ramp_description:
      'A competent Trebolife closer closes ~5 sales/day.\n\n• Month 1 = $1,100\n• Month 2 = $2,090\n• Month 6 = $6,050\n• Month 12 = $11,900\n\nBy which week do you expect to be consistently closing 5 sales/day?',
    ramp_week_1_2: 'Week 1-2 (I close fast, I already have the method)',
    ramp_week_3_4: 'Week 3-4 (I need to calibrate the script and learn the product)',
    ramp_month_2: 'Month 2 (I need a full month of practice)',
    ramp_month_3_plus: 'Month 3 or more (I need time to learn from scratch)',

    churn_title: 'Closing with FIT vs closing with pressure',
    churn_scenario:
      'You closed Maria on a Family Wellness Service membership ($29/mo). She paid the first month. Before the second charge she cancels saying: "I\'m not using it, it\'s not useful for me".',
    churn_question:
      'What would you have done DIFFERENTLY on the initial call so Maria would have made it happily to month 6? Be concrete: what question did you not ask? what expectation did you not clarify? what did you over-promise?',
    churn_placeholder:
      "E.g.: on the call I didn't ask which discounts she would use first. Without knowing what real need it covered...",
    churn_hint: "The recruiter reads this — be honest, don't go generic.",

    // ─── Portal (FASE 6 i18n) ──────────────────────
    // Login
    portal_title: 'Recruiter Portal',
    portal_login_subtitle: 'Restricted access · Magnetraffic',
    portal_login_email_placeholder: 'you@email.com',
    portal_login_password_placeholder: 'Password',
    portal_login_btn_loading: 'Signing in...',
    portal_login_btn: 'Sign in',
    portal_login_error_empty: 'Please enter your email and password.',
    portal_login_error_credentials: 'Incorrect credentials. Please verify your email and password.',
    portal_login_error_generic: 'Error signing in.',

    // Header / nav
    portal_header_title: 'Recruiter Portal',
    portal_btn_refresh: 'Refresh',
    portal_btn_logout: 'Sign out',
    portal_recruiter_fallback: 'Recruiter',

    // Stats cards
    portal_stat_my_candidates: 'My Candidates',
    portal_stat_scheduled: 'Scheduled',
    portal_stat_elite: 'Elite',
    portal_stat_qualified: 'Qualified',
    portal_stat_potential: 'Potential',

    // Recruiter metrics dashboard
    metrics_range_today: 'Today',
    metrics_range_7d: '7 days',
    metrics_range_30d: '30 days',
    metrics_range_all: 'All',
    metrics_kpi_candidates: 'My candidates',
    metrics_kpi_scheduled: 'Scheduled',
    metrics_kpi_interviewed: 'Interviewed',
    metrics_kpi_hired: 'Hired',
    metrics_kpi_hire_rate: 'Hire rate',
    metrics_kpi_no_shows: 'No-shows',
    metrics_funnel_title: 'Your closing funnel',
    metrics_funnel_assigned: 'Assigned',
    metrics_funnel_scheduled: 'Scheduled',
    metrics_funnel_interviewed: 'Interviewed',
    metrics_funnel_hired: 'Hired',
    metrics_funnel_vs_prev: '{percent}% vs previous stage',
    metrics_company_title: 'Company breakdown',
    metrics_company_trebolife: 'Trebolife',
    metrics_company_traduce: 'Traduce',
    metrics_company_unassigned: 'Unassigned',
    metrics_trend_title: 'Last 14 days',
    metrics_trend_total: 'Total: {n}',
    metrics_trend_avg: 'Average: {n}/day',
    metrics_empty: 'No data in this range',

    // Insights — Actionable pending
    insights_pending_title: "Today's actionable items",
    insights_pending_urgent: 'Urgent',
    insights_pending_followup: 'Upcoming interviews (48h)',
    insights_pending_no_contact: 'Recently assigned (<24h)',
    insights_pending_assigned_ago: 'Assigned {hours}h ago, not scheduled',
    insights_pending_in_hours: 'in {hours}h',
    insights_pending_received_ago: '{hours}h ago',
    insights_pending_empty: 'Nothing pending here',
    // Insights — Lead quality
    insights_quality_title: 'Your lead quality',
    insights_quality_team: 'team',
    insights_quality_empty: 'No assigned candidates yet.',
    // Insights — Velocity
    insights_velocity_title: 'Closer velocity',
    insights_velocity_to_schedule: 'Assigned → Scheduled',
    insights_velocity_to_hire: 'Scheduled → Hired',
    insights_velocity_avg_score: 'Avg score of your hires',
    insights_velocity_team: 'team: {value}',
    insights_velocity_faster: '{percent}% faster',
    insights_velocity_slower: '{percent}% slower',
    insights_velocity_empty: 'No interviews scheduled yet to measure velocity.',
    // Insights — Hire breakdown
    insights_breakdown_title: 'Your closing profile',
    insights_breakdown_bucket_elite: '110+ pts (Elite)',
    insights_breakdown_bucket_calificado: '90-109 pts',
    insights_breakdown_bucket_potencial: '80-89 pts',
    insights_breakdown_insight_elite: 'Your hires are mostly Elite ({n}/{total}). You sell better to premium leads.',
    insights_breakdown_insight_calificado: 'You close Qualified leads well ({n}/{total}). Your strength is the mid-range.',
    insights_breakdown_insight_mixed: 'You close evenly across all levels. Versatile.',
    insights_breakdown_insight_empty: "No hires logged yet. Once you start hiring, you'll see the pattern here.",

    // Gamification (PHASE 9)
    gamification_leaderboard_title: 'Monthly ranking',
    gamification_leaderboard_empty: "No hires this month yet — be the first ⭐",
    gamification_leaderboard_you: 'You',
    gamification_leaderboard_you_position: 'You: position #{position} of {total}',
    gamification_leaderboard_of_goal: '{count} of {goal}',
    gamification_streak_title: 'Your streak',
    gamification_streak_days: 'days in a row closing',
    gamification_streak_day_singular: 'day in a row closing',
    gamification_streak_zero: 'No active streak',
    gamification_streak_best: 'Your best streak: {days} days',
    gamification_streak_last_hire: 'Last close: {days} days ago',
    gamification_streak_last_hire_today: 'Last close: today',
    gamification_streak_admin_only: 'Only visible to recruiters',
    gamification_projection_title: 'Monthly goal',
    gamification_projection_above: '📈 On pace for {projected} — beating the goal of {goal}',
    gamification_projection_match: "📊 You're exactly on goal: {projected}",
    gamification_projection_below: "⚠️ At this pace you'd close {projected} of {goal}. You need to speed up.",
    gamification_projection_day: 'Day {day} of {total} of the month',
    gamification_projection_marker: 'projection',

    // Status labels (badge)
    portal_status_elite: 'ELITE',
    portal_status_calificado: 'QUALIFIED',
    portal_status_potencial: 'POTENTIAL',
    portal_status_descartado: 'DISCARDED',
    portal_status_en_progreso: 'IN PROGRESS',

    // Interview status labels
    portal_interview_agendada: 'Scheduled',
    portal_interview_entrevistado: 'Interviewed',
    portal_interview_no_asistio: 'No show',
    portal_interview_reprogramado: 'Rescheduled',
    portal_interview_rechazado_post: 'Rejected post-interview',

    // Filters
    portal_search_placeholder: 'Search by name or phone...',
    portal_filter_all: 'All statuses',
    portal_filter_elite: 'Elite',
    portal_filter_calificado: 'Qualified',
    portal_filter_potencial: 'Potential',
    portal_filter_descartado: 'Discarded',
    portal_filter_en_progreso: 'In progress',
    portal_btn_clear: 'Clear',

    // Totalizador
    portal_candidate_singular: 'candidate',
    portal_candidate_plural: 'candidates',
    portal_of_total: 'of {total}',
    portal_filter_active: 'filter active',

    // Table headers
    portal_col_name: 'Name',
    portal_col_phone: 'Phone',
    portal_col_location: 'Location',
    portal_col_score: 'Score',
    portal_col_result: 'Result',
    portal_col_interview: 'Interview',
    portal_col_date: 'Date',

    // Table states
    portal_loading_candidates: 'Loading candidates...',
    portal_empty_candidates: 'No candidates match your search',

    // Footer
    portal_footer: '{filtered} of {total} candidates · Magnetraffic HR',

    // Config panel
    portal_config_title: 'My Settings',
    portal_config_name: 'Name',
    portal_config_label: 'Label',
    portal_config_total_assigned: 'Total assigned',
    portal_config_calendar_url: 'Calendar URL',
    portal_btn_copied: 'Copied',
    portal_btn_copy_link: 'Copy link',

    // Modal — candidate detail
    portal_modal_loading: 'Loading full data...',
    portal_modal_phone: 'Phone',
    portal_modal_email: 'Email',
    portal_modal_location: 'Location',
    portal_modal_interview_status: 'Interview status',
    portal_modal_interview_date: 'Interview date',
    portal_modal_eval_date: 'Evaluation date',
    portal_modal_llm_title: 'LLM-evaluated responses',
    portal_modal_notes_title: 'Notes',

    // ─── Admin (FASE 6 i18n) ──────────────────────
    // Login
    admin_login_title: 'Admin Panel',
    admin_login_subtitle: 'Restricted access · Magnetraffic',
    admin_login_email_placeholder: 'you@email.com',
    admin_login_password_placeholder: 'Password',
    admin_login_btn: 'Access Panel',
    admin_login_btn_loading: 'Validating...',
    admin_login_error_empty: 'Please enter your email and password.',
    admin_login_error_credentials: 'Incorrect credentials.',
    admin_login_error_generic: 'Error signing in.',

    // Header
    admin_btn_refresh: 'Refresh',
    admin_btn_logout: 'Sign out',

    // Tabs
    admin_tab_candidates: 'Candidates',
    admin_tab_recruiters: 'Recruiters',
    admin_tab_companies: 'Companies',
    admin_tab_analytics: 'Analytics',

    // Status labels (STATUS_CONFIG)
    admin_status_elite: 'ELITE',
    admin_status_calificado: 'QUALIFIED',
    admin_status_potencial: 'POTENTIAL',
    admin_status_descartado: 'DISCARDED',
    admin_status_en_progreso: 'IN PROGRESS',

    // Interview status labels (INTERVIEW_STATUS_CONFIG)
    admin_interview_agendada: 'Scheduled',
    admin_interview_entrevistado: 'Interviewed',
    admin_interview_no_asistio: 'No show',
    admin_interview_reprogramado: 'Rescheduled',
    admin_interview_rechazado_post: 'Rejected post-interview',

    // Score labels (SCORE_LABELS)
    admin_score_label_E1_cierre: 'Direct closing',
    admin_score_label_E1_volumen: 'Call volume',
    admin_score_label_E3_copywriting: 'Copywriting',
    admin_score_label_E4_objeciones: 'Objections',
    admin_score_label_E5_autonomia: 'Autonomy',
    admin_score_label_E6_filosofia: 'Sales philosophy',
    admin_score_label_C1_estabilidad: 'Job stability',
    admin_score_label_V1_penalty: 'Consistency penalty',
    admin_score_label_E2_penalty: 'Narrative penalty',

    // Filters
    admin_search_placeholder: 'Search by name, phone or email...',
    admin_filter_all_statuses: 'All statuses',
    admin_filter_elite: 'Elite',
    admin_filter_calificado: 'Qualified',
    admin_filter_potencial: 'Potential',
    admin_filter_descartado: 'Discarded',
    admin_filter_en_progreso: 'In progress',
    admin_filter_all_recruiters: 'All recruiters',
    admin_filter_today: 'Today',
    admin_filter_yesterday: 'Yesterday',
    admin_filter_this_week: 'This week',
    admin_filter_this_month: 'This month',
    admin_btn_clear_dates: 'Clear',

    // Stats cards
    admin_stat_total: 'Total',
    admin_stat_today: 'Today',
    admin_stat_qualified: 'Qualified',
    admin_stat_discarded: 'Discarded',
    admin_stat_avg_duration: 'Avg. duration',

    // Totalizador
    admin_count_evaluation_singular: 'evaluation',
    admin_count_evaluation_plural: 'evaluations',
    admin_count_of: 'of {total}',
    admin_filter_active: 'filter active',

    // Table headers
    admin_col_name: 'Name',
    admin_col_phone: 'Phone',
    admin_col_location: 'Location',
    admin_col_score: 'Score',
    admin_col_result: 'Result',
    admin_col_recruiter: 'Recruiter',
    admin_col_interview: 'Interview',
    admin_col_date: 'Date',

    // Table states
    admin_loading_evaluations: 'Loading evaluations...',
    admin_empty_evaluations: 'No evaluations match your search',
    admin_error_loading: 'Error loading data: {error}',
    admin_btn_retry: 'Retry',

    // Table action
    admin_btn_view: 'View →',

    // Footer
    admin_footer: '{filtered} of {total} evaluations · Magnetraffic HR',

    // Modal tabs
    admin_modal_tab_candidate: 'Candidate',
    admin_modal_tab_summary: 'Summary',
    admin_modal_tab_answers: 'Answers',
    admin_modal_tab_score: 'Evaluation',
    admin_modal_tab_interview: 'Interview',

    // Modal — candidate tab
    admin_modal_loading_detail: 'Loading full detail...',
    admin_modal_llm_responses_title: 'LLM-evaluated responses',
    admin_modal_print_btn: 'Print / PDF',

    // Modal — resume tab
    admin_modal_candidate_data_title: 'Candidate Data',
    admin_modal_profile_summary_title: 'Profile Summary',
    admin_modal_exit_reason_title: 'Reason for leaving last job',
    admin_modal_best_reactivation_title: 'Best Reactivation Message',

    // Modal — resume tab candidate fields
    admin_modal_field_phone: 'Phone',
    admin_modal_field_email: 'Email',
    admin_modal_field_location: 'Location',
    admin_modal_field_age: 'Age',
    admin_modal_field_marital: 'Marital status',
    admin_modal_field_calls_day: 'Calls/day',
    admin_modal_field_last_income: 'Last income',
    admin_modal_field_eval_date: 'Evaluation',

    // Modal — QA tab
    admin_modal_qa_title: 'Questions & Answers',
    admin_modal_qa_empty: 'This evaluation has no detailed answers saved.\nFull answers are saved from today on new evaluations.',

    // Modal — score tab
    admin_modal_score_breakdown_title: 'Score Breakdown',
    admin_modal_score_criteria_title: 'Applied Criteria',
    admin_modal_score_flags_title: 'Detected Flags',
    admin_modal_score_discard_title: 'Discard Reason',

    // Modal — interview tab
    admin_modal_interview_title: 'Interview Management',
    admin_modal_interview_recruiter_label: 'Assigned recruiter',
    admin_modal_interview_recruiter_placeholder: 'Recruiter name...',
    admin_modal_interview_unassigned: 'Unassigned',
    admin_modal_interview_status_label: 'Interview status',
    admin_modal_interview_no_status: '— No status —',
    admin_modal_interview_print_no_status: 'No status',
    admin_modal_interview_date_label: 'Interview date',
    admin_modal_interview_no_date: 'No date assigned',
    admin_modal_interview_notes_label: 'Recruiter notes',
    admin_modal_interview_notes_placeholder: 'Post-interview observations, impressions, next steps...',
    admin_modal_saving: 'Saving...',
    admin_modal_save_error: 'Error saving: {error}',

    // Recruiter panel
    admin_recruiter_weights_label: 'Active weight sum:',
    admin_recruiter_weights_over: '(exceeds 100%!)',
    admin_recruiter_col_name: 'Name',
    admin_recruiter_col_label: 'Label',
    admin_recruiter_col_calendar: 'Calendar',
    admin_recruiter_col_weight: 'Weight %',
    admin_recruiter_col_total: 'Total Assigned',
    admin_recruiter_col_real_pct: '% Real',
    admin_recruiter_col_status: 'Status',
    admin_recruiter_col_distribution: 'Distribution',
    admin_recruiter_col_actions: 'Actions',
    admin_recruiter_active: 'Active',
    admin_recruiter_inactive: 'Inactive',
    admin_recruiter_btn_save: 'Save',
    admin_recruiter_btn_cancel: 'Cancel',
    admin_recruiter_btn_edit: 'Edit',
    admin_recruiter_empty: 'No recruiters configured yet.',
    admin_recruiter_btn_add: '+ Add recruiter',
    admin_recruiter_add_title: 'New recruiter',
    admin_recruiter_add_error_required: 'Name, label and calendar URL are required.',
    admin_recruiter_field_name_label: 'Name',
    admin_recruiter_field_name_placeholder: 'E.g.: María González',
    admin_recruiter_field_label_label: 'Label',
    admin_recruiter_field_label_placeholder: 'E.g.: Recruiter 3',
    admin_recruiter_field_calendar_label: 'Calendar URL',
    admin_recruiter_field_weight_label: 'Weight %',

    // Company assignment section
    admin_company_assignment_title: 'Assignment by Company',

    // ─── Performance tab (admin) ────────────────────────────────────────────
    admin_tab_performance: 'Performance',
    admin_perf_title: 'Team Performance',
    admin_perf_podium_title: 'Top 3 of the month',
    admin_perf_podium_empty: 'No hires yet this month — the podium will fill as the first closes are recorded.',
    admin_perf_x_of_y: '{count} of {goal}',
    admin_perf_quick_actions: 'Quick actions',
    admin_perf_btn_view_abandoned: 'View abandoned candidates ({count})',
    admin_perf_jump_abandoned_toast: 'Jumping to the abandoned section…',
    admin_perf_comparison_title: 'Recruiter comparison',
    admin_perf_col_recruiter: 'Recruiter',
    admin_perf_col_companies: 'Companies',
    admin_perf_col_hires_mes: 'Hires/mo',
    admin_perf_col_goal: 'Goal',
    admin_perf_col_hire_rate: 'Hire-rate',
    admin_perf_col_assign_to_schedule: 'Avg assign→sched',
    admin_perf_col_schedule_to_hire: 'Avg sched→hired',
    admin_perf_col_lead_quality: 'Lead quality',
    admin_perf_col_streak: 'Streak',
    admin_perf_sin_data: 'No data for active recruiters.',
    admin_perf_recruiters_count: '{count} active recruiters',

    // ─── Recruiter goal (inline edit) ───────────────────────────────────────
    admin_recruiter_goal_label: 'Monthly goal',
    admin_recruiter_goal_updated: 'Goal updated for {name}',

    // ─── Modal — Q&A FASE 10 + Loom ─────────────────────────────────────────
    admin_qa_inbound_title: 'Inbound call opening',
    admin_qa_language_title: 'Closing language',
    admin_qa_lang_es_only: 'Spanish only',
    admin_qa_lang_bilingual: 'Bilingual (ES/EN)',
    admin_modal_loom_btn: 'Watch Loom video (60s)',

    // ─── Analytics panel ────────────────────────────────────────────────────
    admin_analytics_title: 'Funnel Analytics',
    admin_analytics_company_all: 'All',
    admin_analytics_range_today: 'Today',
    admin_analytics_range_7d: '7d',
    admin_analytics_range_30d: '30d',
    admin_analytics_range_all: 'All',
    admin_analytics_temporal_tooltip: 'Time range — applies to global funnel and abandoned',
    admin_analytics_temporal_note: 'Time filters coming soon for the global funnel. For now the "abandoned" section applies them live.',
    admin_analytics_error: 'Could not load analytics: {error}',
    admin_analytics_loading: 'Loading analytics...',
    admin_analytics_no_data: 'No analytics data available',
    admin_analytics_kpi_total: 'Total evaluations',
    admin_analytics_kpi_completed: 'Completed',
    admin_analytics_kpi_conversion: 'Conversion (elite+qual.)',
    admin_analytics_kpi_in_progress: 'In progress',
    admin_analytics_of_total: 'of total',
    admin_analytics_of_completed: 'of completed',
    admin_analytics_funnel_title: 'Drop-off by Step',
    admin_analytics_by_status: 'By Result',
    admin_analytics_by_device: 'By Device',
    admin_analytics_avg_step_title: 'Average time per step (seconds)',

    // ─── Abandoned section ──────────────────────────────────────────────────
    admin_abandoned_title: 'Abandoned candidates (≥ {hours}h)',
    admin_abandoned_hours: 'Hours:',
    admin_abandoned_reactivate: 'Reactivate',
    admin_abandoned_empty: 'Nobody abandoned in this window ✓',
    admin_abandoned_col_name: 'Name',
    admin_abandoned_col_phone: 'Phone',
    admin_abandoned_col_step: 'Step',
    admin_abandoned_col_inactive: 'Inactive for',

    // ─── Export ─────────────────────────────────────────────────────────────
    admin_export_csv: 'Export CSV',

    // ─── Traduce specific ───────────────────────────────────────────────────
    basic_description_traduce:
      "Hi {name}. To be a Traduce closer we need to confirm 3 things:\n\n• Where you're writing from\n• Your email (so we can send you process info)\n• That you actually have 40+ hours per week (immigrant clients require heavy follow-up)",

    exp_description_traduce:
      "At Traduce you sell certified translations ($14-$120/order) for immigration paperwork (USCIS, DMV, courts, schools).\n\nTell me:\n• Have you worked with clients who need 5-10 contacts before buying (like immigration or bureaucratic processes)?\n• On average, how long did it take you to close that type of lead?\n• Have you sold to Hispanic families in the US before?\n\nAnd give me a concrete example: client calls asking for 1 page for $14 — how do you move them up to an $80-120 package without being pushy?",

    react_description_traduce:
      "A client requested a quote 1 month ago and hasn't responded since.\n\nWrite the REAL message you would send them today to reactivate them. Not the concept — the literal message you'd send via WhatsApp or email.",

    objection_setup_traduce:
      "You're selling the Family Wellness Service ($29/mo — medical and dental discounts for the family). The prospect tells you:",
    objection_quote_traduce:
      "💬 \"Look, I appreciate the call but I already have my insurance and I don't need anything else\"",
    objection_description_traduce:
      'What do you respond exactly? As if you were on the call — the literal words, not the concept.',

    autonomy_description_traduce:
      'Working 100% remotely with 80+ active leads at different stages (some requested a quote, others said "later", others haven\'t responded in weeks), how do you organize your pipeline to avoid losing any of them?',

    // Step 11 — Ramp-up (Traduce)
    ramp_title_traduce: 'Ramp-up speed',
    ramp_description_traduce:
      'At Traduce the average ticket is $100/order with 5% commission (~$5/sale) plus retention bonuses.\n\n• Estimated month 1 = $300-500\n• Month 3 with returning clients = $800-1,200\n• Month 6 with active referrals = $1,500+\n\nIn your last job, by which week did you reach your quota? How long did it take you to close the average lead?',
    ramp_week_1_2_traduce: 'Week 1-2 (I close fast, I already have a follow-up system)',
    ramp_week_3_4_traduce: 'Week 3-4 (I need to understand the product and calibrate my pitch)',
    ramp_month_2_traduce: 'Month 2 (I need a full month of practice and feedback)',
    ramp_month_3_plus_traduce: 'Month 3 or more (I need time to learn from scratch)',

    // Step 12 — Retention (Traduce — reuses simulated product)
    churn_title_traduce: 'Closing with FIT vs closing with pressure',
    churn_scenario_traduce:
      'You closed Maria on a Family Wellness Service membership ($29/mo). She paid the first month. Before the second charge she cancels saying: "I\'m not using it, it\'s not useful for me".',
    churn_question_traduce:
      'What would you have done DIFFERENTLY on the initial call so Maria would have made it happily to month 6? Be concrete: what question did you not ask? what expectation did you not clarify? what did you over-promise?',
    churn_placeholder_traduce:
      "E.g.: on the call I didn't ask which discounts she would use first. Without knowing what real need it covered...",
  },
} as const;

export type TranslationKey = keyof typeof translations.es;

export default translations;

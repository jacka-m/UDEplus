export type Language = "en" | "es" | "fr" | "pt" | "zh";

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.ude": "UDE+",
    "nav.signOut": "Sign out",
    "nav.endSession": "End Session",

    // Auth pages
    "auth.createAccount": "Create Account",
    "auth.joinUDE": "Join UDE+ to start analyzing orders",
    "auth.username": "Username",
    "auth.chooseUsername": "Choose a username",
    "auth.password": "Password",
    "auth.atLeast8": "At least 8 characters",
    "auth.confirmPassword": "Confirm Password",
    "auth.phone": "Phone Number",
    "auth.phoneFormat": "(555) 123-4567",
    "auth.zipCode": "ZIP Code",
    "auth.zipCodeHelp": "Used to calculate local minimum wage for scoring",
    "auth.language": "Preferred Language",
    "auth.nextVerify": "Next: Verify Phone",
    "auth.privacy": "Privacy & Security",
    "auth.privacyPassword": "Your password is encrypted and secure",
    "auth.privacyPhone": "Phone number used only for 2-step verification",
    "auth.privacyCompliance": "Your data complies with CCPA and privacy laws",
    "auth.privacyNoShare": "No third-party data sharing",
    "auth.alreadyHaveAccount": "Already have an account?",
    "auth.signIn": "Sign in",
    "auth.signInHeader": "Welcome Back",
    "auth.signInSubtitle": "Sign in to your UDE+ account",
    "auth.signInButton": "Sign In",
    "auth.dontHaveAccount": "Don't have an account?",
    "auth.signUpLink": "Sign up",
    "auth.verifyPhone": "Verify Phone",
    "auth.enterCode": "Enter the 6-digit code",
    "auth.verifyButton": "Verify & Create Account",
    "auth.resendCode": "Resend Code",
    "auth.verifyingText": "Verifying..",

    // Session pages
    "session.startDriving": "Ready to Drive?",
    "session.startSubtitle": "Start a driving session to begin analyzing and tracking your orders",
    "session.sessionBenefits": "What happens in a session:",
    "session.benefit1": "Get AI-powered scores for each order before you accept",
    "session.benefit2": "Track quick metrics right after each dropoff",
    "session.benefit3": "Receive a reminder 2 hours after you finish for final details",
    "session.benefit4": "Your data trains our ML model to improve predictions",
    "session.tips": "Pro Tips:",
    "session.tip1": "You can end your session anytime",
    "session.tip2": "Quick feedback keeps data fresh and accurate",
    "session.tip3": "Final payout data helps calibrate our model",
    "session.startButton": "Start a Driving Session!",
    "session.startingSession": "Starting Session...",
    "session.sessionDescription":
      "Your session will track all orders and metrics until you end it",

    // Session end greetings
    "sessionEnd.haveGreatNight": "Have a great night!",
    "sessionEnd.haveGreatMorning": "Have a great morning!",
    "sessionEnd.haveGreatAfternoon": "Have a great afternoon!",
    "sessionEnd.haveGreatEvening": "Have a great evening!",
    "sessionEnd.sessionSummary": "Session Summary",
    "sessionEnd.totalOrders": "Total Orders",
    "sessionEnd.estEarnings": "Est. Earnings",
    "sessionEnd.totalHours": "Total Hours",
    "sessionEnd.avgHourlyRate": "Avg. Hourly Rate",
    "sessionEnd.finalDetails": "Final Details in 2 Hours",
    "sessionEnd.finalDetailsMessage":
      "We'll send you a reminder to add pickup location names & addresses, and final payout amounts",
    "sessionEnd.mlTraining": "ML Model Training",
    "sessionEnd.mlMessage":
      "Your feedback helps our AI get smarter at predicting which orders are worth taking",
    "sessionEnd.startNewSession": "Start New Session",
    "sessionEnd.sessionHistory": "You can view your full session history in your profile",

    // Order analysis
    "order.welcomeUDE": "Welcome to UDE+",
    "order.orderAnalysis": "Enter Order Details",
    "order.numberOfStops": "Number of Stops",
    "order.shownPayout": "Shown Payout from Order",
    "order.miles": "Miles (Distance)",
    "order.estimatedTime": "Estimated Time (minutes)",
    "order.pickupZone": "Pickup Zone (City)",
    "order.analyzeButton": "Analyze Order",
    "order.analysisComplete": "Order Analysis Complete",
    "order.doNotTake": "⚠️ Recommendation: Do not take this order.",
    "order.takeoffer": "✓ Recommendation: Take this order.",
    "order.tookOffer": "Took Offer",
    "order.declinedOffer": "Declined Offer",
    "order.distance": "Distance:",
    "order.estTime": "Est. Time:",
    "order.stops": "Stops:",
    "order.payout": "Payout:",

    // Post-order survey
    "survey.quickFeedback": "Quick Feedback",
    "survey.dropoffZone": "Dropoff Zone",
    "survey.dropoffZoneHelp": "e.g., Downtown, West Hollywood",
    "survey.parkingDifficulty": "Parking Difficulty",
    "survey.parkingHelp": "(1=Easy, 3=Difficult)",
    "survey.dropoffDifficulty": "Dropoff Difficulty",
    "survey.endZoneQuality": "End Zone Quality",
    "survey.endZoneHelp": "(1=Bad, 3=Excellent)",
    "survey.routeCohesion": "Route Cohesion",
    "survey.routeCohesionHelp": "(1=Chaotic, 5=Perfect)",
    "survey.dropoffCompression": "Dropoff Compression",
    "survey.dropoffCompressionHelp": "(1=Far, 5=Clustered)",
    "survey.nextOrderMomentum": "Next Order Momentum",
    "survey.nextOrderHelp": "(1=Dead, 5=Busy)",
    "survey.completeButton": "Complete & Back to Session",
    "survey.saving": "Saving...",
    "survey.finalDetailsReminder": "Final Details",
    "survey.finalDetailsMessage":
      "You'll receive a reminder in 2 hours to add the pickup location name, address, and final payout information.",

    // Onboarding
    "onboarding.title": "Welcome to UDE+",
    "onboarding.startSession": "Start a Driving Session",
    "onboarding.step1Title": "How to Start",
    "onboarding.step1Desc":
      "Click the 'Start a Driving Session' button whenever you're ready to begin driving. All orders and metrics will be tracked within this session.",
    "onboarding.step2Title": "Analyze Orders",
    "onboarding.step2Desc":
      "Before accepting each order, UDE+ will score it based on payout, distance, time, and historical data. Scores range from 1 (bad) to 4 (great).",
    "onboarding.step3Title": "Quick Feedback",
    "onboarding.step3Desc":
      "Right after each dropoff, you'll answer quick questions about parking, dropoff difficulty, and next order availability. This takes about 30 seconds.",
    "onboarding.step4Title": "2-Hour Follow-up",
    "onboarding.step4Desc":
      "Two hours after you finish, we'll remind you to add the pickup location and final payout. This completes your order record for ML training.",
    "onboarding.step5Title": "Session Summary",
    "onboarding.step5Desc":
      "When you end your session, you'll see your stats: total orders, earnings, hourly rate, and a reminder about the 2-hour follow-up.",
    "onboarding.next": "Next",
    "onboarding.skip": "Skip",
    "onboarding.finish": "Start Using UDE+",

    // Validation errors
    "error.usernameRequired": "Username is required",
    "error.usernameTooShort": "Username must be at least 3 characters",
    "error.passwordRequired": "Password is required",
    "error.passwordTooShort": "Password must be at least 8 characters",
    "error.passwordMismatch": "Passwords do not match",
    "error.phoneRequired": "Phone number is required",
    "error.phoneInvalid": "Please enter a valid phone number",
    "error.zipCodeRequired": "ZIP Code is required",
    "error.zipCodeInvalid": "Please enter a valid ZIP Code",
    "error.usernameTaken": "Username already exists",
    "error.verificationFailed": "Verification failed",
    "error.invalidCode": "Invalid verification code",
    "error.signupFailed": "Sign up failed",
    "error.loginFailed": "Login failed",
  },

  es: {
    // Navigation
    "nav.ude": "UDE+",
    "nav.signOut": "Cerrar sesión",
    "nav.endSession": "Terminar Sesión",

    // Auth pages
    "auth.createAccount": "Crear Cuenta",
    "auth.joinUDE": "Únete a UDE+ para comenzar a analizar pedidos",
    "auth.username": "Nombre de usuario",
    "auth.chooseUsername": "Elige un nombre de usuario",
    "auth.password": "Contraseña",
    "auth.atLeast8": "Al menos 8 caracteres",
    "auth.confirmPassword": "Confirmar Contraseña",
    "auth.phone": "Número de Teléfono",
    "auth.phoneFormat": "(555) 123-4567",
    "auth.zipCode": "Código Postal",
    "auth.zipCodeHelp":
      "Se utiliza para calcular el salario mínimo local para la puntuación",
    "auth.language": "Idioma Preferido",
    "auth.nextVerify": "Siguiente: Verificar Teléfono",
    "auth.privacy": "Privacidad y Seguridad",
    "auth.privacyPassword": "Tu contraseña está encriptada y segura",
    "auth.privacyPhone":
      "El número de teléfono se utiliza solo para la verificación de 2 pasos",
    "auth.privacyCompliance": "Tus datos cumplen con las leyes CCPA y privacidad",
    "auth.privacyNoShare": "Sin compartir datos con terceros",
    "auth.alreadyHaveAccount": "¿Ya tienes una cuenta?",
    "auth.signIn": "Inicia sesión",
    "auth.signInHeader": "Bienvenido de Vuelta",
    "auth.signInSubtitle": "Inicia sesión en tu cuenta de UDE+",
    "auth.signInButton": "Iniciar Sesión",
    "auth.dontHaveAccount": "¿No tienes una cuenta?",
    "auth.signUpLink": "Regístrate",
    "auth.verifyPhone": "Verificar Teléfono",
    "auth.enterCode": "Ingresa el código de 6 dígitos",
    "auth.verifyButton": "Verificar y Crear Cuenta",
    "auth.resendCode": "Reenviar Código",
    "auth.verifyingText": "Verificando...",

    // Session pages
    "session.startDriving": "¿Listo para Conducir?",
    "session.startSubtitle":
      "Inicia una sesión de conducción para comenzar a analizar y rastrear tus pedidos",
    "session.sessionBenefits": "Lo que sucede en una sesión:",
    "session.benefit1":
      "Obtén puntuaciones impulsadas por IA para cada pedido antes de aceptar",
    "session.benefit2": "Rastrea métricas rápidas inmediatamente después de cada entrega",
    "session.benefit3":
      "Recibe un recordatorio 2 horas después de terminar para detalles finales",
    "session.benefit4":
      "Tus datos entrenan nuestro modelo de ML para mejorar las predicciones",
    "session.tips": "Consejos Pro:",
    "session.tip1": "Puedes terminar tu sesión en cualquier momento",
    "session.tip2": "Los comentarios rápidos mantienen los datos frescos y precisos",
    "session.tip3": "Los datos de pago final ayudan a calibrar nuestro modelo",
    "session.startButton": "¡Comenzar una Sesión de Conducción!",
    "session.startingSession": "Iniciando Sesión...",
    "session.sessionDescription":
      "Tu sesión rastreará todos los pedidos y métricas hasta que la termines",

    // Session end greetings
    "sessionEnd.haveGreatNight": "¡Que tengas una gran noche!",
    "sessionEnd.haveGreatMorning": "¡Que tengas una gran mañana!",
    "sessionEnd.haveGreatAfternoon": "¡Que tengas una gran tarde!",
    "sessionEnd.haveGreatEvening": "¡Que tengas una gran noche!",
    "sessionEnd.sessionSummary": "Resumen de Sesión",
    "sessionEnd.totalOrders": "Pedidos Totales",
    "sessionEnd.estEarnings": "Ganancias Est.",
    "sessionEnd.totalHours": "Horas Totales",
    "sessionEnd.avgHourlyRate": "Tarifa Horaria Promedio",
    "sessionEnd.finalDetails": "Detalles Finales en 2 Horas",
    "sessionEnd.finalDetailsMessage":
      "Te enviaremos un recordatorio para agregar nombres y direcciones de ubicaciones de recogida, y montos de pago finales",
    "sessionEnd.mlTraining": "Entrenamiento del Modelo ML",
    "sessionEnd.mlMessage":
      "Tus comentarios ayudan a nuestro IA a ser más inteligente para predecir qué pedidos vale la pena tomar",
    "sessionEnd.startNewSession": "Iniciar Nueva Sesión",
    "sessionEnd.sessionHistory":
      "Puedes ver tu historial de sesión completo en tu perfil",

    // Order analysis
    "order.welcomeUDE": "Bienvenido a UDE+",
    "order.orderAnalysis": "Ingresa Detalles del Pedido",
    "order.numberOfStops": "Número de Paradas",
    "order.shownPayout": "Pago Mostrado del Pedido",
    "order.miles": "Millas (Distancia)",
    "order.estimatedTime": "Tiempo Estimado (minutos)",
    "order.pickupZone": "Zona de Recogida (Ciudad)",
    "order.analyzeButton": "Analizar Pedido",
    "order.analysisComplete": "Análisis de Pedido Completo",
    "order.doNotTake":
      "⚠️ Recomendación: No tomar este pedido.",
    "order.takeoffer":
      "✓ Recomendación: Tomar este pedido.",
    "order.tookOffer": "Tomé la Oferta",
    "order.declinedOffer": "Rechacé la Oferta",
    "order.distance": "Distancia:",
    "order.estTime": "Tiempo Est.:",
    "order.stops": "Paradas:",
    "order.payout": "Pago:",

    // Post-order survey
    "survey.quickFeedback": "Comentarios Rápidos",
    "survey.dropoffZone": "Zona de Entrega",
    "survey.dropoffZoneHelp": "ej. Centro, West Hollywood",
    "survey.parkingDifficulty": "Dificultad de Estacionamiento",
    "survey.parkingHelp": "(1=Fácil, 3=Difícil)",
    "survey.dropoffDifficulty": "Dificultad de Entrega",
    "survey.endZoneQuality": "Calidad de Zona Final",
    "survey.endZoneHelp": "(1=Malo, 3=Excelente)",
    "survey.routeCohesion": "Cohesión de Ruta",
    "survey.routeCohesionHelp": "(1=Caótico, 5=Perfecto)",
    "survey.dropoffCompression": "Compresión de Entrega",
    "survey.dropoffCompressionHelp": "(1=Lejos, 5=Agrupado)",
    "survey.nextOrderMomentum": "Impulso del Próximo Pedido",
    "survey.nextOrderHelp": "(1=Muerto, 5=Ocupado)",
    "survey.completeButton": "Completar y Volver a Sesión",
    "survey.saving": "Guardando...",
    "survey.finalDetailsReminder": "Detalles Finales",
    "survey.finalDetailsMessage":
      "Recibirás un recordatorio en 2 horas para agregar el nombre de la ubicación de recogida, dirección y monto de pago final.",

    // Onboarding
    "onboarding.title": "Bienvenido a UDE+",
    "onboarding.startSession": "Comenzar una Sesión de Conducción",
    "onboarding.step1Title": "Cómo Comenzar",
    "onboarding.step1Desc":
      "Haz clic en el botón 'Comenzar una Sesión de Conducción' cuando estés listo para comenzar a conducir. Todos los pedidos y métricas se rastrearán dentro de esta sesión.",
    "onboarding.step2Title": "Analizar Pedidos",
    "onboarding.step2Desc":
      "Antes de aceptar cada pedido, UDE+ lo puntuará en función del pago, distancia, tiempo y datos históricos. Las puntuaciones van del 1 (malo) al 4 (excelente).",
    "onboarding.step3Title": "Comentarios Rápidos",
    "onboarding.step3Desc":
      "Justo después de cada entrega, responderás preguntas rápidas sobre estacionamiento, dificultad de entrega y disponibilidad del próximo pedido. Esto toma aproximadamente 30 segundos.",
    "onboarding.step4Title": "Seguimiento de 2 Horas",
    "onboarding.step4Desc":
      "Dos horas después de terminar, te recordaremos que agregues la ubicación de recogida y el pago final. Esto completa tu registro de pedidos para el entrenamiento de ML.",
    "onboarding.step5Title": "Resumen de Sesión",
    "onboarding.step5Desc":
      "Cuando termines tu sesión, verás tus estadísticas: pedidos totales, ganancias, tarifa horaria y un recordatorio sobre el seguimiento de 2 horas.",
    "onboarding.next": "Siguiente",
    "onboarding.skip": "Saltar",
    "onboarding.finish": "Comenzar a Usar UDE+",

    // Validation errors
    "error.usernameRequired": "Se requiere nombre de usuario",
    "error.usernameTooShort": "El nombre de usuario debe tener al menos 3 caracteres",
    "error.passwordRequired": "Se requiere contraseña",
    "error.passwordTooShort": "La contraseña debe tener al menos 8 caracteres",
    "error.passwordMismatch": "Las contraseñas no coinciden",
    "error.phoneRequired": "Se requiere número de teléfono",
    "error.phoneInvalid": "Por favor ingresa un número de teléfono válido",
    "error.zipCodeRequired": "Se requiere código postal",
    "error.zipCodeInvalid": "Por favor ingresa un código postal válido",
    "error.usernameTaken": "El nombre de usuario ya existe",
    "error.verificationFailed": "La verificación falló",
    "error.invalidCode": "Código de verificación inválido",
    "error.signupFailed": "El registro falló",
    "error.loginFailed": "El inicio de sesión falló",
  },

  fr: {
    "nav.ude": "UDE+",
    "nav.signOut": "Se déconnecter",
    "auth.createAccount": "Créer un Compte",
    "auth.username": "Nom d'utilisateur",
    "auth.password": "Mot de passe",
    "auth.phone": "Numéro de Téléphone",
    "auth.zipCode": "Code Postal",
    "auth.language": "Langue Préférée",
    "auth.privacy": "Confidentialité et Sécurité",
    "session.startDriving": "Prêt à Conduire?",
    "onboarding.title": "Bienvenue chez UDE+",
    // Add more French translations as needed
  },

  pt: {
    "nav.ude": "UDE+",
    "nav.signOut": "Sair",
    "auth.createAccount": "Criar Conta",
    "auth.username": "Nome de Usuário",
    "auth.password": "Senha",
    "auth.phone": "Número de Telefone",
    "auth.zipCode": "CEP",
    "auth.language": "Idioma Preferido",
    // Add more Portuguese translations as needed
  },

  zh: {
    "nav.ude": "UDE+",
    "nav.signOut": "登出",
    "auth.createAccount": "创建账户",
    "auth.username": "用户名",
    "auth.password": "密码",
    "auth.phone": "电话号码",
    "auth.zipCode": "邮编",
    "auth.language": "首选语言",
    // Add more Chinese translations as needed
  },
};

export function t(key: string, language: Language = "en"): string {
  return translations[language]?.[key] || translations.en[key] || key;
}

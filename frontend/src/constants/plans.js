export const SUBSCRIPTION_PLANS = [
    {
        id: 'basic',
        name: 'Básico',
        price: 15000,
        currency: 'ARS',
        period: 'mensual',
        description: 'Ideal para barberos independientes.',
        features: [
            'Gestión de Turnos',
            'Hasta 200 clientes',
            'Recordatorios por Email',
            'Soporte Básico'
        ],
        recommended: false,
        color: 'blue'
    },
    {
        id: 'pro',
        name: 'Profesional',
        price: 25000,
        currency: 'ARS',
        period: 'mensual',
        description: 'Para barberías en crecimiento.',
        features: [
            'Turnos Ilimitados',
            'Clientes Ilimitados',
            'Gestión de Empleados',
            'Recordatorios WhatsApp',
            'Reportes Avanzados',
            'Soporte Prioritario'
        ],
        recommended: true,
        color: 'urban-accent' // Gold/Orange
    },
    {
        id: 'premium',
        name: 'Empire',
        price: 40000,
        currency: 'ARS',
        period: 'mensual',
        description: 'La solución completa para franquicias.',
        features: [
            'Todo lo de Pro',
            'Múltiples Sucursales',
            'App Personalizada (PWA)',
            'API Access',
            'Account Manager Dedicado'
        ],
        recommended: false,
        color: 'purple'
    }
];

export const PAYMENT_PROVIDERS = [
    { id: 'mercadopago', name: 'Mercado Pago', icon: 'mp' },
    { id: 'transfer', name: 'Transferencia Bancaria', icon: 'bank' }
];

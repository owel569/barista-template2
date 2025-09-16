export const ROLES = {
    directeur: 'Directeur',
    gerant: 'Gérant',
    employe: 'Employé',
    customer: 'Client'
};
export const ROLE_HIERARCHY = {
    directeur: 4,
    gerant: 3,
    employe: 2,
    customer: 1
};
export const DEFAULT_PERMISSIONS = {
    directeur: ['*'],
    gerant: [
        'dashboard:read',
        'orders:*',
        'reservations:*',
        'menu:*',
        'inventory:read',
        'employees:read',
        'statistics:read'
    ],
    employe: [
        'dashboard:read',
        'orders:read',
        'orders:update',
        'reservations:read',
        'reservations:update',
        'menu:read'
    ],
    customer: [
        'menu:read',
        'orders:create',
        'reservations:create',
        'profile:read',
        'profile:update'
    ]
};

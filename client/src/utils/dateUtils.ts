// Gestion explicite de la timezone - Amélioration des attached_assets
export function getLocalDate(): string {
  return new Date().toLocaleDateString('fr-CA'); // Format YYYY-MM-DD local
}

export function getLocalDateTime(): string {
  const now = new Date();
  return now.toLocaleDateString('fr-CA') + 'T' + now.toTimeString().split(' ')[0];
}

export function formatDateForDisplay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTimeForDisplay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTimeForDisplay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Obtenir les dates de la semaine pour le calendrier
export function getWeekDates(startDate: Date): Date[] {
  const dates = [];
  const monday = new Date(startDate);
  const dayOfWeek = monday.getDay();
  const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajuster pour commencer le lundi
  monday.setDate(diff);

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }

  return dates;
}

// Obtenir les dates du mois pour le calendrier
export function getMonthDates(year: number, month: number): Date[] {
  const dates = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Ajouter les jours du mois précédent pour remplir la première semaine
  const startDate = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Commencer le lundi
  startDate.setDate(firstDay.getDate() - daysToSubtract);

  // Calculer le nombre de semaines nécessaires
  const weeksNeeded = Math.ceil((daysToSubtract + lastDay.getDate()) / 7);
  const totalDays = weeksNeeded * 7;

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }

  return dates;
}

// Calculer le nombre de lignes pour la grille mensuelle
export function getMonthGridRows(dates: Date[]): number {
  return Math.ceil(dates.length / 7);
}
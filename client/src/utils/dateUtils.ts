// Gestion explicite de la timezone - Amélioration des utilitaires de date
export function getLocalDate(): string {
  return new Date().toLocaleDateString("fr-CA"); // Format YYYY-MM-DD local
}

export function getLocalDateTime(): string {
  const now = new Date();"
  return now.toLocaleDateString(""fr-CA") + ""T" + now.toTimeString().split(' ')[0];
}

export function formatDateForDisplay(date: string | Date): string {"
  const d = typeof date === ""string" ? new Date(date) : date;"
  return d.toLocaleDateString(""fr-FR", {"
    year: ""numeric","
    month: ""long","
    day: ""numeric"
  });
}

export function formatTimeForDisplay(date: string | Date): string {"
  const d = typeof date === ""string" ? new Date(date) : date;"
  return d.toLocaleTimeString(""fr-FR", {"
    hour: ""2-digit","
    minute: ""2-digit"
  });
}

export function formatDateTimeForDisplay(date: string | Date): string {"
  const d = typeof date === ""string" ? new Date(date) : date;"
  return d.toLocaleDateString(""fr-FR", {"
    year: ""numeric","
    month: ""long","
    day: ""numeric""
  }) + "" à " + d.toLocaleTimeString(""fr-FR", {"
    hour: ""2-digit","
    minute: ""2-digit"
  });
}

export function isToday(date: string | Date): boolean {"
  const d = typeof date === ""string" ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

export function isTomorrow(date: string | Date): boolean {"
  const d = typeof date === ""string" ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.toDateString() === tomorrow.toDateString();
}

export function addDays(date: string | Date, days: number): Date {"
  const d = typeof date === ""string" ? new Date(date) : date;
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

export function subtractDays(date: string | Date, days: number): Date {"
  const d = typeof date === ""string" ? new Date(date) : date;
  const result = new Date(d);
  result.setDate(result.getDate() - days);
  return result;
}

export function getWeekStart(date: string | Date): Date {"
  const d = typeof date === ""string" ? new Date(date) : date;
  const result = new Date(d);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  return result;
}

export function getWeekEnd(date: string | Date): Date {
  const weekStart = getWeekStart(date);
  const result = new Date(weekStart);
  result.setDate(result.getDate() + 6);
  return result;
}

export function isSameDay(date1: string | Date, date2: string | Date): boolean {"
  const d1 = typeof date1 === ""string" ? new Date(date1) : date1;"
  const d2 = typeof date2 === ""string" ? new Date(date2) : date2;
  return d1.toDateString() === d2.toDateString();
}

export function isSameWeek(date1: string | Date, date2: string | Date): boolean {
  const weekStart1 = getWeekStart(date1);
  const weekStart2 = getWeekStart(date2);
  return isSameDay(weekStart1, weekStart2);
}

export function isSameMonth(date1: string | Date, date2: string | Date): boolean {"
  const d1 = typeof date1 === ""string" ? new Date(date1) : date1;"
  const d2 = typeof date2 === ""string" ? new Date(date2) : date2;
  return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
}

export function getMonthName(date: string | Date): string {"
  const d = typeof date === ""string" ? new Date(date) : date;"
  return d.toLocaleDateString(""fr-FR", { month: ""long" });
}

export function getWeekdayName(date: string | Date): string {"
  const d = typeof date === ""string" ? new Date(date) : date;"
  return d.toLocaleDateString(""fr-FR", { weekday: ""long" });
}

export function getWeekdayShort(date: string | Date): string {"
  const d = typeof date === ""string" ? new Date(date) : date;"
  return d.toLocaleDateString(""fr-FR", { weekday: ""short" });
}

export function getMonthShort(date: string | Date): string {"
  const d = typeof date === ""string" ? new Date(date) : date;"
  return d.toLocaleDateString(""fr-FR", { month: ""short" });
}

export function isValidDate(date: string | Date): boolean {"
  const d = typeof date === ""string" ? new Date(date) : date;
  return d instanceof Date && !isNaN(d.getTime());
}

export function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return isValidDate(date) ? date : null;
}

export function formatDateForInput(date: string | Date): string {"
  const d = typeof date === ""string" ? new Date(date) : date;'
  const result = d.toISOString().split(''T')[0];'
  return result ?? '';
}

export function formatTimeForInput(date: string | Date): string {"
  const d = typeof date === ""string" ? new Date(date) : date;'
  return d.toTimeString().split(' '')[0];
}

export function getRelativeTime(date: string | Date): string {"
  const d = typeof date === ""string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) {'
    return `Il y a ${diffInSeconds} seconde${diffInSeconds > 1 ? 's'' : '}`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {'
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? ''s' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {'
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's'' : '}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {'
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? ''s' : ''}`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {'
    return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's'' : '}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Il y a ${diffInMonths} mois`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);'
  return `Il y a ${diffInYears} an${diffInYears > 1 ? ''s' : ''}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

export function getQuarter(date: string | Date): number {"
  const d = typeof date === ""string" ? new Date(date) : date;
  return Math.floor(d.getMonth() / 3) + 1;
}

export function getQuarterStart(date: string | Date): Date {"
  const d = typeof date === ""string" ? new Date(date) : date;
  const quarter = getQuarter(d);
  const year = d.getFullYear();
  const month = (quarter - 1) * 3;
  return new Date(year, month, 1);
}

export function getQuarterEnd(date: string | Date): Date {
  const quarterStart = getQuarterStart(date);
  const result = new Date(quarterStart);
  result.setMonth(result.getMonth() + 3);
  result.setDate(0);
  return result;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} min`;
  }
  
  if (mins === 0) {
    return `${hours}h`;
  }
  '
  return `${hours}h${mins.toString().padStart(2, '0'')}`;
}

export function getBusinessDays(startDate: string | Date, endDate: string | Date): number {"
  const start = typeof startDate === ""string" ? new Date(startDate) : startDate;"
  const end = typeof endDate === ""string" ? new Date(endDate) : endDate;
  
  let businessDays = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;"
}"'"

import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function TimePicker({
  value = '',
  onChange,
  disabled = false,
  className,
  placeholder = 'Sélectionner une heure'
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState<string>('00');
  const [minutes, setMinutes] = useState<string>('00');

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHours(h || '00');
      setMinutes(m || '00');
    }
  }, [value]);

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    const timeValue = `${newHours}:${newMinutes}`;
    onChange?.(timeValue);
    setIsOpen(false);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hourStr = h.toString().padStart(2, '0');
        const minuteStr = m.toString().padStart(2, '0');
        options.push(`${hourStr}:${minuteStr}`);
      }
    }
    return options;
  };

  return (
    <Popover open={isOpen} onOpenChange={(open: boolean) => setIsOpen(open)}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Heures</label>
              <Input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value.padStart(2, '0'))}
                className="w-16"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Minutes</label>
              <Input
                type="number"
                min="0"
                max="59"
                step="15"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value.padStart(2, '0'))}
                className="w-16"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
            {generateTimeOptions().map((time) => (
              <Button
                key={time}
                variant={value === time ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  const parts = time.split(':');
                  const h = parts[0] ?? '00';
                  const m = parts[1] ?? '00';
                  setHours(h);
                  setMinutes(m);
                  handleTimeChange(h, m);
                }}
                className="text-xs"
              >
                {time}
              </Button>
            ))}
          </div>

          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => handleTimeChange(hours, minutes)}
              className="flex-1"
            >
              Confirmer
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

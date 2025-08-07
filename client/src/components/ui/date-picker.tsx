import React from 'react';
import { Input } from '@/components/ui/input';

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Sélectionnez une date", className, ...props }: DatePickerProps) {
  return (
    <Input
      type="date"
      value={value)}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
}
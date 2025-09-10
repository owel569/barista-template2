
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface TypedSelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
  options: Array<{ value: T; label: string }>;
  className?: string;
}

export function TypedSelect<T extends string>({
  value,
  onValueChange,
  placeholder,
  options,
  className
}: TypedSelectProps<T>) {
  return (
    <Select 
      value={value} 
      onValueChange={(newValue: string) => onValueChange(newValue as T)}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


import React, { useState } from 'react';
import { Star } from 'lucide-react';

export interface RatingProps {
  value: number;
  onChange?: (rating: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showValue?: boolean;
  precision?: 'full' | 'half';
  className?: string;
}

export function Rating({
  value,
  onChange,
  max = 5,
  size = 'md',
  readonly = false,
  showValue = false,
  precision = 'full',
  className = ''
}: RatingProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleStarClick = (rating: number) => {
    if (readonly || !onChange) return;
    
    if (precision === 'half') {
      onChange(rating);
    } else {
      onChange(Math.ceil(rating));
    }
  };

  const handleStarHover = (rating: number) => {
    if (readonly) return;
    setHoveredValue(rating);
  };

  const renderStars = () => {
    const stars = [];
    const displayValue = hoveredValue ?? value;

    for (let i = 1; i <= max; i++) {
      const filled = displayValue >= i;
      const halfFilled = precision === 'half' && displayValue >= i - 0.5 && displayValue < i;

      stars.push(
        <button
          key={i}
          type="button"
          disabled={readonly}
          className={`
            ${sizeClasses[size]}
            ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
            transition-all duration-150
            ${!readonly ? 'hover:text-yellow-400' : ''}
          `}
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarHover(i)}
          onMouseLeave={() => setHoveredValue(null)}
        >
          <Star
            className={`
              ${sizeClasses[size]}
              ${filled || halfFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              ${halfFilled ? 'fill-yellow-200' : ''}
            `}
          />
        </button>
      );

      // Pour la précision demi-étoile, ajouter un point à mi-chemin
      if (precision === 'half' && i < max) {
        const halfValue = i + 0.5;
        const halfFilled = displayValue >= halfValue;

        stars.push(
          <button
            key={`${i}-half`}
            type="button"
            disabled={readonly}
            className={`
              ${sizeClasses[size]}
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              transition-all duration-150 -ml-3 z-10
            `}
            onClick={() => handleStarClick(halfValue)}
            onMouseEnter={() => handleStarHover(halfValue)}
            onMouseLeave={() => setHoveredValue(null)}
          >
            <div className="relative">
              <Star
                className={`
                  ${sizeClasses[size]}
                  text-gray-300
                `}
              />
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star
                  className={`
                    ${sizeClasses[size]}
                    ${halfFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  `}
                />
              </div>
            </div>
          </button>
        );
      }
    }

    return stars;
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {renderStars()}
      </div>
      
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          {value.toFixed(precision === 'half' ? 1 : 0)}/{max}
        </span>
      )}
    </div>
  );
}

// Hook pour gérer le rating
export function useRating(initialValue: number = 0) {
  const [rating, setRating] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRating = async (callback?: (rating: number) => Promise<void>) => {
    if (!callback) return;
    
    setIsSubmitting(true);
    try {
      await callback(rating);
    } catch (error) {
      console.error('Erreur lors de la soumission du rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    rating,
    setRating,
    isSubmitting,
    submitRating
  };
}


import React from 'react';
import { Card, CardContent, CardHeader } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Star, Clock, Leaf } from 'lucide-react';

export interface MenuItemCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  preparationTime?: number;
  rating?: number;
  availability: boolean;
  onAddToCart?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function MenuItemCard({
  id,
  name,
  description,
  price,
  image,
  category,
  isVegan,
  isGlutenFree,
  preparationTime,
  rating,
  availability,
  onAddToCart,
  onViewDetails
}: MenuItemCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(price);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {image && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
          {!availability && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Badge variant="destructive">Indisponible</Badge>
            </div>
          )}
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">
            {name}
          </h3>
          <div className="text-lg font-bold text-primary">
            {formatPrice(price)}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
          {isVegan && (
            <Badge variant="outline" className="text-xs text-green-600">
              <Leaf className="h-3 w-3 mr-1" />
              Vegan
            </Badge>
          )}
          {isGlutenFree && (
            <Badge variant="outline" className="text-xs text-blue-600">
              Sans Gluten
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between mb-4">
          {preparationTime && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              {preparationTime} min
            </div>
          )}
          
          {rating && (
            <div className="flex items-center gap-1 text-sm text-yellow-600">
              <Star className="h-4 w-4 fill-current" />
              {rating.toFixed(1)}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(id)}
              className="flex-1"
            >
              Détails
            </Button>
          )}
          
          {onAddToCart && availability && (
            <Button
              size="sm"
              onClick={() => onAddToCart(id)}
              className="flex-1"
            >
              Ajouter
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

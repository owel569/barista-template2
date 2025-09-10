
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SimplePageProps {
  title: string;
  description: string;
}

export default function SimplePage({ title, description }: SimplePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      backgroundColor: 'hsl(42, 33%, 96%)',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <Card className="w-full max-w-md" style={{
        backgroundColor: 'white',
        border: '1px solid hsl(20, 5.9%, 90%)',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
      }}>
        <CardHeader>
          <CardTitle style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'hsl(30, 67%, 16%)'
          }}>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{
            color: 'hsl(25, 57%, 41%)',
            lineHeight: '1.6'
          }}>
            {description}
          </p>
          
          {/* Test des couleurs */}
          <div className="mt-4 space-y-2">
            <div className="bg-coffee-primary text-coffee-light p-2 rounded" style={{
              backgroundColor: 'hsl(25, 57%, 41%)',
              color: 'hsl(42, 33%, 96%)',
              padding: '0.5rem',
              borderRadius: '0.25rem'
            }}>
              Test couleur primaire
            </div>
            <div className="bg-coffee-secondary text-coffee-dark p-2 rounded" style={{
              backgroundColor: 'hsl(39, 77%, 72%)',
              color: 'hsl(30, 67%, 16%)',
              padding: '0.5rem',
              borderRadius: '0.25rem'
            }}>
              Test couleur secondaire
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

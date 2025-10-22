import React from 'react';
import { CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export interface InfoPageButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline';
  icon?: LucideIcon;
}

export interface InfoPageProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  iconColor?: 'green' | 'blue' | 'red' | 'amber';
  buttons: InfoPageButton[];
}

export const InfoPage: React.FC<InfoPageProps> = ({
  title,
  description,
  icon: Icon = CheckCircle,
  iconColor = 'green',
  buttons,
}) => {
  const getIconColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'blue':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'red':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'amber':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      default:
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`w-16 h-16 ${getIconColorClasses(iconColor)} rounded-full flex items-center justify-center`}>
              <Icon className="w-8 h-8" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground">
              {description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {buttons.map((button, index) => {
              const ButtonIcon = button.icon;
              return (
                <Button
                  key={index}
                  onClick={button.onClick}
                  variant={button.variant || 'default'}
                  className={`w-full ${button.variant === 'outline' ? '' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
                >
                  {ButtonIcon && <ButtonIcon className="w-4 h-4 mr-2" />}
                  {button.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

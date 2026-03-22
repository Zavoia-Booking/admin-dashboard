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
  // const getIconColorClasses = (color: string) => {
  //   switch (color) {
  //     case 'green':
  //       return 'bg-success-bg text-success';
  //     case 'blue':
  //       return 'bg-info-bg text-info';
  //     case 'red':
  //       return 'bg-error-bg text-error';
  //     case 'amber':
  //       return 'bg-warning-bg text-warning';
  //     default:
  //       return 'bg-success-bg text-success';
  //   }
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardContent className="p-8 space-y-5">
          <div className="flex items-start gap-3">
            <div className="space-y-1 min-w-0">
              <h1 className="text-xl font-semibold text-foreground-1">
                {title}
              </h1>
              <p className="text-sm text-foreground-3">
                {description}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {buttons.map((button, index) => {
              const ButtonIcon = button.icon;
              return (
                <Button
                  key={index}
                  onClick={button.onClick}
                  variant={button.variant || 'default'}
                  rounded="full"
                  className={`w-full ${button.variant === 'outline' ? '' : 'bg-primary hover:bg-primary-hover text-white'}`}
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

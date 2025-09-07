import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Building2, Users, Wrench } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface BusinessSetupPromptProps {
  title?: string;
  message?: string;
  ctaLabel?: string;
  onClickNavigateTo?: string; // default: '/welcome'
}

const BusinessSetupPrompt: React.FC<BusinessSetupPromptProps> = ({
  title = 'Complete your business setup',
  message = 'Before inviting team members, creating services, or adding locations, please finish setting up your business information.',
  ctaLabel = 'Finish business setup',
  onClickNavigateTo = '/welcome',
}) => {
  const navigate = useNavigate();

  return (
    <Card className="rounded-lg border bg-white p-6 text-center">
      <CardContent className="p-0">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Building2 className="h-6 w-6" />
            <Users className="h-5 w-5" />
            <Wrench className="h-5 w-5" />
            <MapPin className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-gray-600 max-w-md">{message}</p>
          {ctaLabel && (
            <Button
              onClick={() => navigate(onClickNavigateTo)}
              className="mt-2"
            >
              {ctaLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessSetupPrompt;



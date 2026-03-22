import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';

const InvitationSuccess: React.FC = () => {
  const { t } = useTranslation('teamMembers');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-background p-4">
      <Card className="max-w-md w-full border border-border shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold text-foreground-1">
              {t('invitationSuccess.title')}
            </h1>
            {email && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                <Mail className="h-3.5 w-3.5 text-foreground-3" />
                <span className="text-sm font-medium text-foreground-1">{email}</span>
              </div>
            )}
            <p className="text-sm text-foreground-3">
              {t('invitationSuccess.description')}
            </p>
          </div>

          <Button
            onClick={() => navigate('/team-members', { replace: true })}
            className="w-full gap-2"
            rounded="full"
          >
            {t('invitationSuccess.goToTeamMembers')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationSuccess;


import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';

const InvitationSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  const handleGoToTeamMembers = () => {
    navigate('/team-members', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="max-w-lg w-full shadow-2xl border-0">
        <CardContent className="pt-12 pb-8 px-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full"></div>
              <div className="relative bg-green-100 dark:bg-green-900/30 p-6 rounded-full">
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Invitation Sent!
              </h1>
              <p className="text-muted-foreground">
                Your team member invitation has been sent successfully
              </p>
            </div>

            {/* Email Display */}
            {email && (
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{email}</span>
              </div>
            )}
            {/* Information Box */}
            <div className="w-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                An invitation email will be sent to <strong>{email || 'the team member'}</strong>. 
                They'll receive instructions to set up their account and join your team.
              </p>
            </div>

            {/* Actions */}
            <div className="w-full pt-4">
              <Button 
                onClick={handleGoToTeamMembers}
                className="w-full"
                size="lg"
              >
                Go to Team Members
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationSuccess;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Users } from 'lucide-react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';

const SeatsUpdateSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-svh flex items-center justify-center bg-muted p-6">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto mb-2 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Team seats updated</h2>
            <p className="text-sm text-muted-foreground">
              Your subscription has been updated successfully.
            </p>
            <Button className="w-full" onClick={() => navigate('/team-members')}>
              <Users className="h-4 w-4 mr-2" /> Go to Team Members
            </Button>
            <Button className="w-full" onClick={() => navigate('/settings?open=billing')}>Go to Billing</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeatsUpdateSuccessPage;



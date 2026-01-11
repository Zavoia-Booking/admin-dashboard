import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

export const SubscriptionExpiredBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full border-red-200 shadow-lg">
        <CardContent className="pt-6 pb-8 px-6 text-center space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-red-900 dark:text-red-100">
              Subscription Required
            </h2>
            <div className="flex items-center justify-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Page Access Unavailable</span>
            </div>
          </div>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Your subscription is not active. To regain access to your business data, please manage your subscription.
          </p>

          {/* Action Button */}
          <div className="pt-4">
            <Button
              onClick={() => navigate('/settings?tab=billing')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6 text-base"
              size="lg"
            >
              Manage Subscription
            </Button>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 dark:text-gray-500">
            All your data is safe and will be restored once you renew.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};


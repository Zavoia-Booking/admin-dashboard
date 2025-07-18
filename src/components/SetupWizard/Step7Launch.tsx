import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Link, Share2, CheckCircle, Circle, ExternalLink } from 'lucide-react';
import { WizardData } from '@/hooks/useSetupWizard';
import { useRouter } from 'next/router';

interface Step7Props {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onLaunch?: () => void;
}

const Step7Launch: React.FC<Step7Props> = ({ data, onUpdate, onLaunch }) => {
  const router = useRouter();
  const bookingLink = `book.appointmentpro.com/${data.businessName.toLowerCase().replace(/\s+/g, '-')}`;
  
  const checklist = [
    { 
      label: 'Business information', 
      completed: data.businessName && data.industry,
      required: true
    },
    { 
      label: 'Location setup', 
      completed: data.isRemote || (data.address && data.city),
      required: true
    },
    { 
      label: 'Services added', 
      completed: data.services.length > 0,
      required: false
    },
    { 
      label: 'Schedule configured', 
      completed: data.schedule.some(day => !day.isClosed),
      required: false
    },
    { 
      label: 'Team members invited', 
      completed: data.worksSolo || data.teamMembers.length > 0,
      required: false
    },
    { 
      label: 'Website template selected', 
      completed: data.selectedTemplate !== '',
      required: false
    }
  ];

  const completedRequired = checklist.filter(item => item.required && item.completed).length;
  const totalRequired = checklist.filter(item => item.required).length;
  const completedOptional = checklist.filter(item => !item.required && item.completed).length;
  const totalOptional = checklist.filter(item => !item.required).length;

  const canLaunch = completedRequired === totalRequired;

  const handleLaunch = () => {
    onUpdate({ isLaunched: true });
    onLaunch?.();
  };

  const shareWhatsApp = () => {
    const message = `🎉 My business is now online! Book appointments with ${data.businessName} at ${bookingLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(bookingLink)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-4 bg-emerald-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <Rocket className="h-10 w-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          You're ready to go live! 🎉
        </h3>
        <p className="text-muted-foreground">
          Your booking system is set up and ready to accept appointments
        </p>
      </div>

      {/* Setup Progress */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h4 className="font-semibold text-foreground">Setup Progress</h4>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-600 text-emerald-600 bg-white text-xs font-semibold">
              {completedRequired}/{totalRequired} Required
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-blue-600 text-blue-600 bg-white text-xs font-semibold">
              {completedOptional}/{totalOptional} Optional
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {checklist.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              {item.completed ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className={`flex-1 ${item.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
              {item.required && (
                <Badge variant="outline" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Booking Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Link className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold text-blue-800">Your Public Booking Link</h4>
        </div>
        <div className="bg-white border border-blue-200 rounded-md p-3 mb-3">
          <code className="text-sm text-blue-800 break-all">{bookingLink}</code>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Copy Link
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Preview Site
          </Button>
        </div>
      </div>

      {/* Share Options */}
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Your Business
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={shareWhatsApp} className="gap-2 bg-green-600 hover:bg-green-700">
            Share on WhatsApp
          </Button>
          <Button onClick={shareFacebook} className="gap-2 bg-blue-600 hover:bg-blue-700">
            Share on Facebook
          </Button>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <h4 className="font-semibold text-emerald-800 mb-2">🎯 Next Steps</h4>
        <ul className="text-sm text-emerald-700 space-y-1">
          <li>• Complete your profile and add more services</li>
          <li>• Set up payment processing</li>
          <li>• Customize your website design</li>
          <li>• Configure email notifications</li>
          <li>• Invite team members to manage bookings</li>
        </ul>
      </div>
      {/* Launch Button */}
      <div className="pt-6 border-t">
        <Button 
          onClick={() => router.push('/dashboard')}
          className="w-full h-12 text-lg gap-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Step7Launch; 
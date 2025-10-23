import React, { useState } from 'react';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Link, Share2, ExternalLink, Copy, CheckCircle2, MapPin, Clock, Users, Check } from 'lucide-react';
import type { StepProps } from '../types';
import { useNavigate } from 'react-router-dom';
import { getBookingUrl } from '../utils';
import { toast } from 'sonner';

const StepLaunch: React.FC<StepProps> = ({ data }) => {
  const navigate = useNavigate();
  const bookingLink = getBookingUrl(data);
  const safeName = (data?.businessInfo?.name || '').trim();
  const [copied, setCopied] = useState(false);

  // Calculate stats
  const workingSolo = Boolean(data?.worksSolo);
  const teamInvitesCount = data?.teamMembers?.length || 0;
  const workingHours = data?.location?.workingHours || {};
  const openDaysCount = Object.values(workingHours).filter((day: any) => day?.isOpen).length;
  
  // Location details
  const isRemote = Boolean(data?.location?.isRemote);
  const locationCity = (data?.location?.addressComponents as any)?.city || (data?.location?.addressComponents as any)?.locality || '';
  const locationType = isRemote ? 'Remote services' : locationCity ? `Physical location in ${locationCity}` : 'Physical location';
  
  // Working hours summary
  const getWorkingHoursSummary = () => {
    if ((data?.location as any)?.open247) return 'Open 24/7';
    if (openDaysCount === 0) return 'No working hours set';
    
    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayAbbrev: { [key: string]: string } = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };
    
    const openDays = daysOrder.filter(day => (workingHours as any)[day]?.isOpen);
    
    if (openDays.length === 0) return 'No working hours set';
    if (openDays.length === 7) return 'Open every day';
    
    // Check if days are consecutive
    const openIndices = openDays.map(day => daysOrder.indexOf(day));
    const isConsecutive = openIndices.every((val, i, arr) => i === 0 || val === arr[i - 1] + 1);
    
    if (isConsecutive && openDays.length > 1) {
      const firstDay = dayAbbrev[openDays[0]];
      const lastDay = dayAbbrev[openDays[openDays.length - 1]];
      const firstDayData = (workingHours as any)[openDays[0]];
      
      if (firstDayData?.start && firstDayData?.end) {
        return `Open ${firstDay}-${lastDay}, ${firstDayData.start}-${firstDayData.end}`;
      }
      return `Open ${firstDay}-${lastDay}`;
    }
    
    // Non-consecutive days, list them
    if (openDays.length <= 3) {
      return `Open ${openDays.map(d => dayAbbrev[d]).join(', ')}`;
    }
    
    // Fallback for complex patterns
    return `Open ${openDays.length} days per week`;
  };
  
  // Team status
  const teamStatus = workingSolo ? 'Solo' : `${teamInvitesCount} team member${teamInvitesCount === 1 ? '' : 's'} invited`;

  const handleShare = async () => {
    const title = `${safeName || 'My business'} is now bookable`;
    const text = `Book appointments with ${safeName || 'my business'}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: bookingLink });
        return;
      }
      await navigator.clipboard.writeText(bookingLink);
    } catch {}
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingLink);
      setCopied(true);
      toast.info('Link copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handlePreview = () => {
    window.open(bookingLink, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="text-left py-4">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">You're live — start taking bookings</h2>
        <p className="text-sm text-muted-foreground">Share your booking link and invite clients. You can fine-tune everything from your dashboard.</p>
      </div>

      {/* Booking Link */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link className="h-5 w-5 text-blue-600" />
          <Label className="text-base font-medium text-gray-700">Public booking link</Label>
        </div>
        <p className="text-sm text-muted-foreground">Share this link with your clients to start receiving bookings</p>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <code className="text-sm text-gray-800 break-all">{bookingLink}</code>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button 
            rounded="full" 
            size="sm"
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer" 
            onClick={handleCopyLink} 
            aria-label="Copy booking link"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            rounded="full" 
            size="sm"
            className="gap-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 cursor-pointer" 
            onClick={handlePreview} 
            aria-label="Preview booking page"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button 
            variant="outline" 
            rounded="full" 
            size="sm"
            className="gap-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 cursor-pointer" 
            onClick={handleShare} 
            aria-label="Share booking link"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </div>

      {/* Setup Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 mt-12">
        <div className="flex items-start gap-3 mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
          <div className="flex-1">
            <Label className="text-base font-medium text-gray-700">{safeName || 'Your business'} is now accepting bookings online</Label>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-xs font-medium text-gray-600">Location</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <p className="text-sm text-gray-900 font-medium break-words">{locationType}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-xs font-medium text-gray-600">Hours</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <p className="text-sm text-gray-900 font-medium break-words">{getWorkingHoursSummary()}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-xs font-medium text-gray-600">Team</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <p className="text-sm text-gray-900 font-medium break-words">{teamStatus}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="pt-2 flex justify-end">
        <Button rounded="full" onClick={() => navigate('/dashboard')} className="w-full md:w-auto md:px-8 h-11 cursor-pointer">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default StepLaunch; 
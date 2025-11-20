import { Card, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Sparkles, Users, MapPin, Briefcase, Globe, TrendingUp, CheckCircle2 } from 'lucide-react';

interface NotListedYetViewProps {
  onStartListing: () => void;
}

export function NotListedYetView({ onStartListing }: NotListedYetViewProps) {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
            <Globe className="h-10 w-10 text-primary" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Take Your Business Online
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your business isn't listed yet for online bookings. Join the marketplace and reach more customers!
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Showcase Services</h3>
                <p className="text-sm text-muted-foreground">
                  Choose which services to display and let customers discover what you offer
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Display Locations</h3>
                <p className="text-sm text-muted-foreground">
                  Select which locations appear on your marketplace profile
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Feature Your Team</h3>
                <p className="text-sm text-muted-foreground">
                  Highlight your team members and build trust with potential clients
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20 mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-4">Why List Your Business?</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">24/7 Bookings:</span> Accept appointments even when you're offline
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Reach More Clients:</span> Get discovered by thousands of potential customers
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Full Control:</span> You decide what to show and what to hide
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Grow Revenue:</span> Fill empty slots and maximize your schedule
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <Button 
            size="lg" 
            className="text-lg px-8 h-14 gap-2 shadow-lg hover:shadow-xl transition-all"
            onClick={onStartListing}
          >
            <TrendingUp className="h-5 w-5" />
            Start Listing Your Business
          </Button>
        </div>
      </div>
    </div>
  );
}


import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";
import { CalendarSync, ArrowRight } from "lucide-react";
import type { Business } from "../../../../features/business/types";

interface TrialStatusCardProps {
  business: Business | null;
  isLoading: boolean;
  onUpgrade?: () => void;
}

interface TrialInfo {
  daysRemaining: number;
  trialEnd: Date;
  trialStart: Date;
  isActive: boolean;
}

const TrialStatusCard: React.FC<TrialStatusCardProps> = ({
  business,
  isLoading,
  onUpgrade,
}) => {
  const navigate = useNavigate();

  const getTrialInfo = (): TrialInfo | null => {
    if (!business?.trialEndsAt) return null;

    const trialEnd = new Date(business.trialEndsAt);
    const trialStart = new Date(business.createdAt);

    // Use backend's daysRemaining if available, otherwise calculate (fallback)
    const daysRemaining =
      business.daysRemaining ??
      Math.ceil(
        (trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

    return {
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      trialEnd,
      trialStart,
      isActive: daysRemaining > 0,
    };
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate("/settings?open=billing");
    }
  };

  const trialInfo = getTrialInfo();

  // Don't render if not loading and no trial info or trial not active
  if (!isLoading && (!trialInfo || !trialInfo.isActive)) {
    return null;
  }

  return (
    <>
      <div className="flex items-end gap-2 mb-8 pt-4">
        <h3 className="text-sm text-muted-foreground">Your subscription status</h3>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {isLoading ? (
        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                <div className="flex-1 min-w-0 space-y-3">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-full max-w-md" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-12 w-32 rounded-full shrink-0" />
            </div>
          </div>
        </div>
      ) : trialInfo && trialInfo.isActive ? (
        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-3 shrink-0 shadow-md">
                    <CalendarSync className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">
                    Free trial active
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mt-6">
                  Full access to all features until{" "}
                  <span className="font-semibold text-gray-900">
                    {trialInfo.trialEnd.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  .
                </p>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Continue without interruption—upgrade when it suits you.
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    Started on{" "}
                    {trialInfo.trialStart.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-200/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-semibold text-emerald-700">
                      {trialInfo.daysRemaining}{" "}
                      {trialInfo.daysRemaining === 1 ? "day" : "days"} left
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleUpgrade}
                className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-gray-900 hover:bg-gray-800 text-white py-6 !px-6 font-semibold shadow-sm cursor-pointer transition-transform active:scale-95 w-full sm:w-auto"
              >
                <span>Upgrade plan</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default TrialStatusCard;


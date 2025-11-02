import React from "react";
import { useSelector } from "react-redux";
import { Button } from "../../../shared/components/ui/button";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import {
  Blocks,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Calendar,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Business } from "../../business/types";
import type { LocationType } from "../../../shared/types/location";
import type { TeamMember } from "../../../shared/types/team-member";
import { getBusinessLoadingSelector } from "../../business/selectors";
import { getLocationLoadingSelector } from "../../locations/selectors";
import TrialStatusCard from "../../../shared/components/common/subscription/TrialStatusCard";

interface StepLaunchProps {
  business: Business | null;
  location: LocationType | null;
  teamMembers: TeamMember[];
}

const StepLaunch: React.FC<StepLaunchProps> = ({
  business,
  location,
  teamMembers,
}) => {
  const navigate = useNavigate();
  const isBusinessLoading = useSelector(getBusinessLoadingSelector);
  const isLocationsLoading = useSelector(getLocationLoadingSelector);
  const isLoading = isBusinessLoading || isLocationsLoading;

  const handleCreateService = () => {
    navigate("/services?open=add");
  };

  const handleGoAssignments = () => {
    navigate("/assignments");
  };

  const handleGoLocations = () => {
    navigate("/locations");
  };

  const handleGoBusinessInfo = () => {
    navigate("/settings?open=business");
  };

  const handleGoCalendar = () => {
    navigate("/calendar");
  };

  return (
    <div className="space-y-6 px-4 md:px-0">
      <div className="text-center py-8 md:py-6 lg:py-8 md:mb-3">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
          <span>Welcome Aboard</span>
        </h2>
        <p className="text-lg text-muted-foreground">
          The calm behind your calendar
        </p>
      </div>

      {/* Here's what you can do next */}
      <div className="flex items-end gap-2 mb-6">
        <p className="text-sm text-muted-foreground">
          Here's what you can do next
        </p>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* Critical Action Card */}
      <div className="relative bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-800 rounded-2xl py-6 md:py-6 p-4 md:p-6 text-white shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Ambient background glows (subtle, non-interactive) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-20 h-80 w-80 rounded-full bg-white/[0.06] blur-2xl"
        ></div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-[-2rem] h-[24rem] w-[24rem] rounded-full bg-sky-400/20 blur-3xl"
        ></div>
        {/* Top radial highlight to draw focus toward heading */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-white/[0.04] blur-2xl"
        ></div>
        {/* Soft radial mask to reduce flatness */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-white/[0.05] [mask-image:radial-gradient(70%_60%_at_15%_0%,#000_50%,transparent_100%)]"
        ></div>
        {/* Subtle grid/texture to avoid banding on large screens */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.03] [mask-image:radial-gradient(70%_60%_at_15%_0%,#000_50%,transparent_100%)] bg-[linear-gradient(0deg,transparent,transparent),linear-gradient(90deg,transparent,transparent),linear-gradient(#ffffff0a_1px,transparent_1px),linear-gradient(90deg,#ffffff08_1px,transparent_1px)] bg-[length:100%_100%,100%_100%,24px_24px,24px_24px]"
        ></div>
        {/* Legibility insurance gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 to-black/20"
        ></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-4 mb-6">
            <div className="hidden md:block bg-white/20 backdrop-blur-sm rounded-xl p-3.5 shrink-0 shadow-lg ring-1 ring-white/20">
              <Blocks className="h-7 w-7 md:h-8 md:w-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-3 leading-tight">
                Now you can create your first service
              </h3>
              <p className="text-blue-50 text-sm leading-relaxed">
                Services are what your clients will see and book on your page.
                Start by adding one — describe what you offer, how long each
                session takes, and what it costs so they can easily schedule.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-3 text-sm bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 md:mb-6">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 h-6 w-6" />
            <p className="text-blue-50">
              No need to get it perfect — you can edit or add more services
              anytime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1 pl-4">
              <div className="text-xs md:text-sm text-blue-100 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                <span>It just takes 2 minutes</span>
              </div>
            </div>
            <Button
              onClick={handleCreateService}
              className="group inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-white text-black py-5 md:py-6 !px-5 md:!px-6 font-semibold shadow-sm cursor-pointer transition-transform active:scale-95 w-full sm:w-auto"
            >
              <span>Create a Service</span>
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Setup Summary */}
      <div>
        <div className="flex items-end gap-2 mb-6 pt-4">
          <h3 className="text-sm text-muted-foreground">Quick overview</h3>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Business Card */}
          {isLoading ? (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 md:p-5 border border-gray-200/70 overflow-hidden">
              <div className="mb-3">
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
              <div className="space-y-2.5">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ) : (
            <div className="group relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 md:p-5 border border-gray-200/70 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  <span className="text-sm font-semibold text-gray-900">
                    Business
                  </span>
                </div>
              </div>
              <div className="space-y-2.5">
                {business?.name ? (
                  <>
                    <div className="text-lg font-bold text-gray-900 leading-tight tracking-tight">
                      {business.name}
                    </div>
                    {business.industry?.name && (
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {business.industry.name}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-lg font-bold text-gray-900 leading-tight">
                    All set
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Location Card */}
          {isLoading ? (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 md:p-5 border border-gray-200/70 overflow-hidden">
              <div className="mb-3">
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
              <div className="space-y-2.5">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ) : (
            <div className="group relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 md:p-5 border border-gray-200/70 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/30 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-semibold text-gray-900">
                    Location
                  </span>
                </div>
              </div>
              <div className="space-y-2.5">
                {location?.isRemote ? (
                  <>
                    {location?.name && (
                      <div className="text-lg font-bold text-gray-900 leading-tight tracking-tight">
                        {location.name}
                      </div>
                    )}
                    <div
                      className={
                        location?.name
                          ? "text-sm text-gray-600 leading-relaxed"
                          : "text-lg font-bold text-gray-900 leading-tight tracking-tight"
                      }
                    >
                      Remote
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed">
                      {location?.timezone || business?.timezone || "—"}
                    </div>
                  </>
                ) : (
                  <>
                    {location?.name && (
                      <div className="text-lg font-bold text-gray-900 leading-tight tracking-tight">
                        {location.name}
                      </div>
                    )}
                    <div
                      className={
                        location?.name
                          ? "text-sm text-gray-600 leading-relaxed"
                          : "text-lg font-bold text-gray-900 leading-tight tracking-tight"
                      }
                    >
                      On-site
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed">
                      {location?.timezone || business?.timezone || "—"}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Team Card */}
          {isLoading ? (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 md:p-5 border border-gray-200/70 overflow-hidden">
              <div className="mb-3">
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
              <div className="space-y-2.5">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : (
            <div className="group relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 md:p-5 border border-gray-200/70 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/30 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-semibold text-gray-900">
                    Team
                  </span>
                </div>
              </div>
              <div className="space-y-2.5">
                {Array.isArray(teamMembers) && teamMembers.length > 0 ? (
                  <>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      <span className="font-semibold">
                        {teamMembers.length}
                      </span>{" "}
                      {teamMembers.length === 1
                        ? "team member invited"
                        : "team members invited"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Awaiting acceptance
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold text-gray-900 leading-tight tracking-tight">
                      Just you for now
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      You can add team members later
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Trial Notification */}
      <TrialStatusCard business={business} isLoading={isBusinessLoading} />

      {/* Next steps section */}
      <div>
        <div className="flex items-end gap-2 mb-6 pt-2">
          <h3 className="text-sm text-muted-foreground">More you can do now</h3>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Assignments */}
          <div className="group relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 md:p-5 border border-gray-200/70 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative space-y-2.5">
              <div className="text-base font-semibold text-gray-900 leading-tight tracking-tight">Assign services</div>
              <div className="text-sm text-gray-600 leading-relaxed mb-6 mt-4">Match services with the right team members—so bookings are routed to the right people.</div>
              <div>
                <Button onClick={handleGoAssignments} variant="outline" rounded="full" className="cursor-pointer inline-flex items-center gap-1.5 !px-8">
                  <span>Assignments</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="group relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 md:p-5 border border-gray-200/70 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-100/30 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative space-y-2.5">
              <div className="text-base font-semibold text-gray-900 leading-tight tracking-tight">Manage locations</div>
              <div className="text-sm text-gray-600 leading-relaxed mb-6 mt-4">Refine your location setup or add more locations as your business grows.</div>
              <div>
                <Button onClick={handleGoLocations} variant="outline" rounded="full" className="cursor-pointer inline-flex items-center gap-1.5 !px-8">
                  <span>Locations</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div>
        <div className="flex items-end gap-2 mb-6 pt-4">
          <h3 className="text-sm text-muted-foreground">Calendar & Appointments</h3>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-sky-500 to-blue-500 rounded-xl p-3 shrink-0 shadow-md">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">
                      Manage your schedule
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      View your calendar, create appointments, and keep everything organized in one place.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleGoCalendar}
                className="group inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 py-5 md:py-6 !px-6 md:!px-8 font-semibold shadow-sm cursor-pointer transition-transform active:scale-95 w-full sm:w-auto"
              >
                <span>Calendar</span>
                <ArrowUpRight
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div>
        <div className="flex items-end gap-2 mb-6 pt-4">
          <h3 className="text-sm text-muted-foreground">Customization & Branding</h3>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl p-3 shrink-0 shadow-md">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">
                      Customize your profile
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Polish your profile with branding, contact info, and details that make a great first impression.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleGoBusinessInfo}
                className="group inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 py-5 md:py-6 !px-6 md:!px-8 font-semibold shadow-sm cursor-pointer transition-transform active:scale-95 w-full sm:w-auto"
              >
                <span>Settings</span>
                <ArrowUpRight
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 pb-8 md:pb-0">
        <Button
          onClick={() => navigate("/dashboard")}
          className="group inline-flex items-center gap-1.5 rounded-full bg-gray-900 hover:bg-gray-800 text-white py-5 md:py-6 !px-6 md:!px-8 font-semibold shadow-sm cursor-pointer transition-transform active:scale-95 w-full sm:w-auto"
        >
          <span>Go to Dashboard</span>
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5"
            aria-hidden="true"
          />
        </Button>
      </div>
    </div>
  );
};

export default StepLaunch;

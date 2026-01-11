import React, { useState } from "react";
import { MapPin, Users, Briefcase, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../../../shared/components/ui/card";
import { Button } from "../../../../shared/components/ui/button";
import { SectionDivider } from "../../../../shared/components/common/SectionDivider";
import type { Location, Service, TeamMember } from "../../types";

interface LocationWithAssignments extends Location {
  services: Service[];
  teamMembers: TeamMember[];
}

interface LocationCatalogSectionProps {
  locations: LocationWithAssignments[];
}

export const LocationCatalogSection: React.FC<LocationCatalogSectionProps> = ({
  locations,
}) => {
  const navigate = useNavigate();
  const [expandedLocationIds, setExpandedLocationIds] = useState<Set<number>>(new Set());

  const toggleLocation = (locationId: number) => {
    setExpandedLocationIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const handleManageAssignments = (locationId: number) => {
    navigate(`/assignments?locationId=${locationId}`);
  };

  if (locations.length === 0) {
    return (
      <div className="space-y-6">
        <SectionDivider title="Catalog" className="uppercase tracking-wider text-foreground-2" />
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-muted-foreground font-medium">
            No locations available. Please add a location first.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionDivider title="Catalog" className="uppercase tracking-wider text-foreground-2" />
      
      <div className="space-y-1.5 px-1">
        <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
          View which services and team members are available at each location. Manage assignments in the{" "}
          <button
            onClick={() => navigate('/assignments')}
            className="text-primary hover:underline font-medium"
          >
            Assignments
          </button>{" "}
          section.
        </p>
      </div>

      <div className="space-y-4">
        {locations.map((location) => {
          const isExpanded = expandedLocationIds.has(location.id);
          const serviceCount = location.services?.length || 0;
          const teamMemberCount = location.teamMembers?.length || 0;

          return (
            <Card
              key={location.id}
              className="overflow-hidden border-border hover:border-border-strong transition-all duration-300"
            >
              {/* Location Header */}
              <div className="flex items-center justify-between p-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleLocation(location.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleLocation(location.id);
                    }
                  }}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-info/10">
                    <MapPin className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground-1">
                      {location.name}
                    </h3>
                    <p className="text-xs text-foreground-3 dark:text-foreground-2">
                      {location.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-foreground-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{serviceCount} services</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground-2">
                    <Users className="w-4 h-4" />
                    <span>{teamMemberCount} team members</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleManageAssignments(location.id)}
                    className="h-8 gap-1.5"
                  >
                    Manage
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  <button
                    onClick={() => toggleLocation(location.id)}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-foreground-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-foreground-2" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Content - Read-only display */}
              {isExpanded && (
                <div className="border-t border-border-subtle">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                    {/* Services Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-primary" />
                          <h4 className="text-sm font-semibold text-foreground-1">
                            Services ({serviceCount})
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {serviceCount === 0 ? (
                          <div className="p-4 text-center border border-dashed border-border rounded-xl bg-muted/20">
                            <p className="text-xs text-muted-foreground">
                              No services assigned to this location
                            </p>
                          </div>
                        ) : (
                          location.services.map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-surface hover:border-border transition-colors"
                            >
                              <span className="text-sm font-medium text-foreground-1">
                                {service.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                                  {(service.price_amount_minor / 100).toFixed(2)}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                                  {service.duration}m
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Team Members Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <h4 className="text-sm font-semibold text-foreground-1">
                            Team Members ({teamMemberCount})
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {teamMemberCount === 0 ? (
                          <div className="p-4 text-center border border-dashed border-border rounded-xl bg-muted/20">
                            <p className="text-xs text-muted-foreground">
                              No team members assigned to this location
                            </p>
                          </div>
                        ) : (
                          location.teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex flex-col p-3 rounded-xl border border-border-subtle bg-surface hover:border-border transition-colors"
                            >
                              <div className="text-sm font-semibold text-foreground-1 leading-none">
                                {member.firstName} {member.lastName}
                              </div>
                              <div className="text-[10px] text-foreground-3 dark:text-foreground-2 mt-1.5 leading-none opacity-70">
                                {member.email}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LocationCatalogSection;

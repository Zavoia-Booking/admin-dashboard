import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useCallback,
  useState,
  useRef,
} from "react";
import { Label } from "../../../shared/components/ui/label";
import { Input } from "../../../shared/components/ui/input";
import { Button } from "../../../shared/components/ui/button";
import { Switch } from "../../../shared/components/ui/switch";
import {
  Plus,
  User,
  Mail,
  AlertCircle,
  HelpCircle,
  Trash2,
  ChevronDown,
} from "lucide-react";
import type { StepProps, StepHandle } from "../types";
import type { InviteTeamMemberPayload } from "../../teamMembers/types";
import { useForm } from "react-hook-form";
import { Badge } from "../../../shared/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../shared/components/ui/popover";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../auth/selectors";
import { toast } from "sonner";
import { emailError } from "../../../shared/utils/validation";

// Local UI state for team members (includes UI-only fields like status and id)
interface LocalTeamMember extends InviteTeamMemberPayload {
  id: string;
  status: "pending";
}

function getAvatarBgColor(email: string | undefined): string {
  const str = (email || "").toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 60% 92%)`;
}

const StepTeam = forwardRef<StepHandle, StepProps>(
  ({ data, onValidityChange, updateData }, ref) => {
    const currentUser = useSelector(selectCurrentUser);
    // Local state for team data - will be populated by useEffect
    const [localTeamMembers, setLocalTeamMembers] = useState<LocalTeamMember[]>(
      []
    );
    const [localWorksSolo, setLocalWorksSolo] = useState(
      data.worksSolo || false
    );
    const [showAllMembers, setShowAllMembers] = useState(false);
    const restRef = useRef<HTMLDivElement>(null);
    const [restHeight, setRestHeight] = useState(0);

    const {
      register,
      handleSubmit,
      reset,
      watch,
      setError,
      clearErrors,
      formState: { errors, isValid },
    } = useForm<{ email: string }>({
      defaultValues: { email: "" },
      mode: "onChange",
    });

    const emailValue = watch("email");

    // Notify parent that team step is always valid
    useEffect(() => {
      if (onValidityChange) {
        onValidityChange(true);
      }
    }, [onValidityChange]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      getFormData: () => ({
        teamMembers: (localTeamMembers || []).map(
          (m): InviteTeamMemberPayload => ({
            email: m.email,
            locationIds: m.locationIds || [], // TODO: Add locationIds to the payload
          })
        ),
        worksSolo: localWorksSolo,
      }),
      triggerValidation: async () => true, // No validation needed for this step
      isValid: () => true, // Team step is always valid (optional)
    }));

    // Sync local state when data changes from Redux
    useEffect(() => {
      const members: LocalTeamMember[] = (data.teamMembers || []).map((m) => {
        // role might exist in saved draft (not in base InviteTeamMemberPayload type)
        return {
          email: m.email,
          locationIds: m.locationIds || [], // TODO: Add locationIds to the payload
          id: `${m.email}`,
          status: "pending" as const,
        };
      });
      setLocalTeamMembers(members);
      setLocalWorksSolo(data.worksSolo || false);
      // Reset form to clear any stale email input
      reset({ email: "" });
    }, [data, reset]);

    // Measure collapsible content height for animation
    useEffect(() => {
      const el = restRef.current;
      if (!el) return;
      // Measure full height for animation variable
      const fullHeight = Array.from(el.children).reduce(
        (acc, child) => acc + (child as HTMLElement).offsetHeight,
        0
      );
      setRestHeight(fullHeight);
      el.style.setProperty(
        "--radix-collapsible-content-height",
        `${fullHeight}px`
      );
    }, [localTeamMembers, showAllMembers]);

    const addTeamMember = handleSubmit(({ email }) => {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) return;
      
      // Check maximum limit of 20 team members in wizard
      if (localTeamMembers.length >= 20) {
        setError("email", {
          type: "manual",
          message: "You can invite up to 20 team members during setup",
        });
        return;
      }
      
      // Disallow inviting your own email
      if (
        currentUser?.email &&
        trimmedEmail === currentUser.email.trim().toLowerCase()
      ) {
        setError("email", {
          type: "manual",
          message: "You can't invite your own email address",
        });
        return;
      }
      const duplicate = localTeamMembers.some(
        (m) => m.email.toLowerCase() === trimmedEmail
      );
      if (duplicate) return;
      const invitation = {
        id: Date.now().toString(),
        email: trimmedEmail,
        locationIds: [], // TODO: Add locationIds to the payload
        status: "pending" as const,
      };
      setLocalTeamMembers((prev) => [...prev, invitation]);
      setLocalWorksSolo(false);
      reset({ email: "" });
      clearErrors("email");
    });

    const removeMember = useCallback((index: number) => {
      setLocalTeamMembers((prev) => {
        const removed = prev[index];
        const next = prev.filter((_, i) => i !== index);
        if (removed) {
          toast.custom(
            (t) => (
              <div className="flex items-center justify-between gap-6 rounded-md border border-border bg-surface px-6 py-3 shadow-sm">
                <div className="min-w-12">
                  <p className="text-sm font-medium text-foreground-1 truncate mb-2">
                    Invite removed
                  </p>
                  <p className="text-xs text-foreground-3 dark:text-foreground-2 truncate">
                    {removed.email}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  rounded="full"
                  className="h-7 px-6 cursor-pointer"
                  onClick={() => {
                    setLocalTeamMembers((curr) => {
                      const arr = [...curr];
                      arr.splice(Math.min(index, arr.length), 0, removed);
                      return arr;
                    });
                    toast.dismiss(t);
                  }}
                >
                  Undo
                </Button>
              </div>
            ),
            { duration: 5000 }
          );
        }
        return next;
      });
    }, []);

    const handleWorksSoloChange = useCallback(
      (worksSolo: boolean) => {
        setLocalWorksSolo(worksSolo);
        if (updateData) {
          updateData({ worksSolo });
        }
      },
      [updateData]
    );

    return (
      <div className="space-y-6">
        {/* Solo Work Toggle */}
        <div
          className={`${
            localWorksSolo
              ? "rounded-lg border border-info-300 bg-info-100 p-4"
              : "bg-surface-active dark:bg-neutral-900 border border-border rounded-lg p-4"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 shrink-0 text-primary" />
              <Label
                htmlFor="worksSolo"
                className={`text-base font-medium cursor-pointer ${
                  localWorksSolo ? "text-neutral-900" : ""
                }`}
              >
                I work solo
              </Label>
            </div>
            <Switch
              id="worksSolo"
              checked={localWorksSolo}
              onCheckedChange={handleWorksSoloChange}
              className="!h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer"
            />
          </div>
          <p className={`text-sm ${
            localWorksSolo
              ? "text-neutral-900"
              : "text-foreground-3 dark:text-foreground-2"
          }`}>
            {localWorksSolo
              ? "Perfect! You're all set to manage your business independently"
              : "Enable this to skip team setup for now. You can always invite team members later from your dashboard to help manage bookings and collaborate"}
          </p>
          {localWorksSolo && (
            <p className="text-sm text-neutral-900 mt-3 pt-3 border-t border-info-300">
              You can invite team members anytime from your dashboard settings
              to collaborate and manage bookings together.
            </p>
          )}
        </div>

        {!localWorksSolo && (
          <>
            {/* Add Team Member */}
            <div className="space-y-2 border-t border-border pt-6 mb-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium text-foreground-1">
                  Invite Team Member
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="What does inviting do?"
                      className="inline-flex items-center justify-center text-foreground-3 dark:text-foreground-1 hover:text-foreground-1 p-0 focus-visible:outline-none cursor-pointer"
                    >
                      <HelpCircle className="h-5 w-5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="end"
                    sideOffset={6}
                    className="text-sm leading-relaxed max-w-xs"
                  >
                    Team members will receive an email invitation to join your
                    business account. They can set their own availability and
                    manage their bookings.
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-3">
                  <div className="flex-1 relative">
                    <Input
                      type="email"
                      placeholder="e.g. colleague@company.com"
                      className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                        errors.email
                          ? "border-destructive bg-error-bg focus-visible:ring-0"
                          : "border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus"
                      }`}
                      aria-invalid={!!errors.email}
                      {...register("email", {
                        validate: (value: string) => {
                          if (!value || !value.trim()) return true;
                          const error = emailError("Team member email", value);
                          return error === null ? true : error;
                        },
                      })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTeamMember();
                        }
                      }}
                    />
                    <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  </div>
                  <Button
                    onClick={addTeamMember}
                    disabled={
                      !emailValue ||
                      emailValue.trim() === "" ||
                      !isValid ||
                      localTeamMembers.length >= 20 ||
                      localTeamMembers.some(
                        (m) =>
                          m.email.toLowerCase() ===
                          emailValue.trim().toLowerCase()
                      )
                    }
                    rounded="full"
                    className="gap-2 h-11 cursor-pointer w-full md:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Add Team Member
                  </Button>
                </div>
                <div className="h-5">
                  {errors.email && (
                    <p
                      className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
                      role="alert"
                      aria-live="polite"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>
                        {String(
                          errors.email.message ||
                            "Please enter a valid email address"
                        )}
                      </span>
                    </p>
                  )}
                </div>
                <p className="text-sm text-foreground-3 dark:text-foreground-2 mt-2 pb-2 md:pb-0">
                  {localTeamMembers.length >= 20 ? (
                    "You have reached the maximum number of team member invitations during setup."
                  ) : (
                    <>
                      You can invite up to {20 - localTeamMembers.length} more team member
                      {20 - localTeamMembers.length === 1 ? "" : "s"} during setup.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Divider between add form and invitations list */}
            <div className="border-t border-border" />

            {/* Current Team Members - moved below */}
            {localTeamMembers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium text-foreground-1">
                    Invitations
                  </Label>
                  <Badge variant="secondary" className="mr-2 dark:bg-sidebar text-sm">
                    {localTeamMembers.length}
                  </Badge>
                </div>

                <div className="relative rounded-lg border border-border bg-surface dark:bg-neutral-900 overflow-visible p-2 pb-0">
                  <div>
                    {/* First 4 members always visible */}
                    {localTeamMembers.slice(0, 4).map((member, index) => (
                      <div
                        key={index}
                        className={`${
                          index < 3 || (index === 3 && localTeamMembers.length > 4)
                            ? "border-b border-border-subtle"
                            : ""
                        }`}
                      >
                        <div className="bg-surface dark:bg-neutral-900 rounded-lg py-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                                style={{
                                  backgroundColor: getAvatarBgColor(member.email),
                                }}
                              >
                                <span className="text-base font-bold text-neutral-900 leading-none">
                                  {member.email?.charAt(0)?.toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-foreground-1 truncate text-sm">
                                  {member.email}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeMember(index)}
                              className="h-7 w-7 p-0 hover:bg-error-bg text-destructive cursor-pointer"
                              aria-label="Remove invitation"
                              title="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Remaining members inside collapsible container */}
                    {localTeamMembers.length > 4 && (
                      <>
                        <div
                          ref={restRef}
                          data-slot="collapsible-content"
                          data-state={showAllMembers ? "open" : "closed"}
                          className={`${
                            showAllMembers ? "h-auto" : "h-0"
                          } overflow-hidden divide-y divide-border-subtle`}
                          style={{
                            ["--radix-collapsible-content-height" as any]: `${restHeight}px`,
                          } as any}
                        >
                          {localTeamMembers.slice(4).map((member, index) => {
                            const actualIndex = index + 4;
                            return (
                              <div key={actualIndex}>
                                <div className="bg-surface dark:bg-neutral-900 rounded-lg py-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div
                                        className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                                        style={{
                                          backgroundColor: getAvatarBgColor(
                                            member.email
                                          ),
                                        }}
                                      >
                                        <span className="text-base font-bold text-neutral-900 leading-none">
                                          {member.email?.charAt(0)?.toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-medium text-foreground-1 truncate text-sm">
                                          {member.email}
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeMember(actualIndex)}
                                      className="h-7 w-7 p-0 hover:bg-error-bg text-destructive cursor-pointer"
                                      aria-label="Remove invitation"
                                      title="Remove"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Expand/collapse toggle button */}
                        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-10">
                          <button
                            type="button"
                            aria-label={
                              showAllMembers
                                ? "Collapse invitations"
                                : "Expand invitations"
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface dark:bg-neutral-900 shadow-sm active:bg-surface-active cursor-pointer"
                            onClick={() => setShowAllMembers((v) => !v)}
                          >
                            <ChevronDown
                              className={`h-6 w-6 text-foreground-1 transition-transform ${
                                showAllMembers ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            {localTeamMembers.length === 0 && (
              <p className="text-sm text-foreground-3 dark:text-foreground-2 pb-6">
                Add teammate emails above and we'll send them invitations when
                you complete setup.{" "}
              </p>
            )}
          </>
        )}
      </div>
    );
  }
);

StepTeam.displayName = "StepTeam";

export default StepTeam;

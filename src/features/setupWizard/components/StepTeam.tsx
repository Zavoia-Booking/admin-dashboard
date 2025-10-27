import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useCallback,
  useState,
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
} from "lucide-react";
import type { StepProps, StepHandle } from "../types";
import { UserRole } from "../../../shared/types/auth";
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
import { selectSubscriptionSummary } from "../../settings/selectors";
import { toast } from "sonner";
import { emailError } from "../../../shared/utils/validation";

// Local UI state for team members (includes UI-only fields like status and id)
interface LocalTeamMember extends InviteTeamMemberPayload {
  role: UserRole;
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
    const subscriptionSummary = useSelector(selectSubscriptionSummary);
    // Local state for team data - will be populated by useEffect
    const [localTeamMembers, setLocalTeamMembers] = useState<LocalTeamMember[]>(
      []
    );
    const [localWorksSolo, setLocalWorksSolo] = useState(
      data.worksSolo || false
    );

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
          (m): InviteTeamMemberPayload & { role: UserRole } => ({
            email: m.email,
            role: m.role || UserRole.TEAM_MEMBER,
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
        const memberWithRole = m as InviteTeamMemberPayload & {
          role?: UserRole;
        };
        return {
          email: m.email,
          role: memberWithRole.role || UserRole.TEAM_MEMBER,
          id: `${m.email}`,
          status: "pending" as const,
        };
      });
      setLocalTeamMembers(members);
      setLocalWorksSolo(data.worksSolo || false);
      // Reset form to clear any stale email input
      reset({ email: "" });
    }, [data, reset]);

    const addTeamMember = handleSubmit(({ email }) => {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) return;
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
        role: UserRole.TEAM_MEMBER as const,
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
              <div className="flex items-center justify-between gap-6 rounded-md border border-gray-200 bg-white px-6 py-3 shadow-sm">
                <div className="min-w-12">
                  <p className="text-sm font-medium text-gray-900 truncate mb-2">
                    Invite removed
                  </p>
                  <p className="text-xs text-gray-600 truncate">
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
              ? "rounded-lg border border-blue-200 bg-blue-50 p-4"
              : "bg-accent/80 border border-accent/30 rounded-lg p-4"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <User
                className={`h-6 w-6 shrink-0 ${
                  localWorksSolo ? "text-blue-600" : "text-primary"
                }`}
              />
              <Label
                htmlFor="worksSolo"
                className="text-base font-medium cursor-pointer"
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
          <p className="text-sm text-muted-foreground">
            {localWorksSolo
              ? "Perfect! You're all set to manage your business independently"
              : "Enable this to skip team setup for now. You can always invite team members later from your dashboard to help manage bookings and collaborate"}
          </p>
          {localWorksSolo && (
            <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-blue-200">
              You can invite team members anytime from your dashboard settings
              to collaborate and manage bookings together.
            </p>
          )}
        </div>

        {!localWorksSolo && (
          <>
            {/* Add Team Member */}
            <div className="space-y-2 border-t border-gray-200 pt-6 mb-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium text-gray-700">
                  Invite Team Member
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="What does inviting do?"
                      className="inline-flex items-center justify-center text-gray-500 hover:text-gray-800 p-0 focus-visible:outline-none cursor-pointer"
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
                          ? "border-destructive bg-red-50 focus-visible:ring-red-400"
                          : "border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400"
                      }`}
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
                    <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  <Button
                    onClick={addTeamMember}
                    disabled={
                      !emailValue ||
                      emailValue.trim() === "" ||
                      !isValid ||
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
                {typeof subscriptionSummary?.availableSeats === "number" && (
                  <p className="text-xs text-muted-foreground">
                    You can invite up to {subscriptionSummary.availableSeats}{" "}
                    more team member
                    {subscriptionSummary.availableSeats === 1 ? "" : "s"}.
                  </p>
                )}
              </div>
            </div>

            {/* Divider between add form and invitations list */}
            <div className="border-t border-gray-200" />

            {/* Current Team Members - moved below */}
            {localTeamMembers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium text-gray-700">
                    Invitations
                  </Label>
                  <Badge variant="secondary" className="text-md mr-2">
                    {localTeamMembers.length}
                  </Badge>
                </div>

                <div>
                  {localTeamMembers.map((member, index) => (
                    <div key={index} className="bg-white rounded-lg py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                            style={{
                              backgroundColor: getAvatarBgColor(member.email),
                            }}
                          >
                            <span className="text-base font-bold text-gray-800 leading-none">
                              {member.email?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate text-sm">
                              {member.email}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMember(index)}
                          className="h-7 w-7 p-0 hover:bg-red-50 text-red-600 cursor-pointer"
                          aria-label="Remove invitation"
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {index < localTeamMembers.length - 1 && (
                        <div className="ml-12 mr-2 mt-2 h-px bg-gray-200" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {localTeamMembers.length === 0 && (
              <p className="text-sm text-muted-foreground pb-6">
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

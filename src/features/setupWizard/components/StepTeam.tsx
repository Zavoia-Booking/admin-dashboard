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
import { Plus, X, User, Mail, AlertCircle } from "lucide-react";
import type { StepProps, StepHandle } from "../types";
import { UserRole } from "../../../shared/types/auth";
import { useForm } from "react-hook-form";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StepTeam = forwardRef<StepHandle, StepProps>(
  ({ data, onValidityChange }, ref) => {
    // Local state for team data
    const [localTeamMembers, setLocalTeamMembers] = useState(
      data.teamMembers || []
    );
    const [localWorksSolo, setLocalWorksSolo] = useState(
      data.worksSolo || false
    );

    const {
      register,
      handleSubmit,
      reset,
      watch,
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
        teamMembers: localTeamMembers,
        worksSolo: localWorksSolo,
      }),
      triggerValidation: async () => true, // No validation needed for this step
      isValid: () => true, // Team step is always valid (optional)
    }));

    // Sync local state when data changes from Redux
    useEffect(() => {
      setLocalTeamMembers(data.teamMembers || []);
      setLocalWorksSolo(data.worksSolo || false);
      // Reset form to clear any stale email input
      reset({ email: "" });
    }, [data, reset]);

    const addTeamMember = handleSubmit(({ email }) => {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) return;
      const duplicate = localTeamMembers.some(
        (m) => m.email.toLowerCase() === trimmedEmail
      );
      if (duplicate) return;
      const invitation = {
        id: Date.now().toString(),
        email: trimmedEmail,
        role: UserRole.TEAM_MEMBER, // Default role
        status: "pending" as const,
      };
      setLocalTeamMembers((prev) => [...prev, invitation]);
      setLocalWorksSolo(false);
      reset({ email: "" });
    });

    const removeMember = useCallback((index: number) => {
      setLocalTeamMembers((prev) => {
        const newMembers = prev.filter((_, i) => i !== index);
        if (newMembers.length === 0) {
          setLocalWorksSolo(true);
        }
        return newMembers;
      });
    }, []);

    const handleWorksSoloChange = useCallback((worksSolo: boolean) => {
      setLocalWorksSolo(worksSolo);
      if (worksSolo) {
        setLocalTeamMembers([]);
      }
    }, []);

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
               You can invite team members anytime from your dashboard settings to collaborate and manage bookings together.
             </p>
           )}
         </div>

        {!localWorksSolo && (
          <>
            {/* Current Team Members */}
            {localTeamMembers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-medium text-gray-700">
                  Team Members
                </Label>
                <div className="space-y-2">
                  {localTeamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {member.email}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeMember(index)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Team Member */}
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <Label className="text-base font-medium text-gray-700">
                Invite Team Member
              </Label>
              <div className="space-y-1">
                <div className="flex items-start gap-3">
                  <div className="flex-1 relative">
                    <Input
                      type="email"
                      placeholder="team.member@example.com"
                      className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                        errors.email
                          ? "border-destructive bg-red-50 focus-visible:ring-red-400"
                          : "border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400"
                      }`}
                      {...register("email", {
                        pattern: { value: emailRegex, message: 'Enter a valid email address' },
                      })}
                    />
                    <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  <Button
                    onClick={addTeamMember}
                    disabled={!emailValue || emailValue.trim() === "" || !isValid}
                    rounded="full"
                    className="gap-2 h-11 cursor-pointer"
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
                      <span>Enter a valid email address</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 shrink-0">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Team invitations
                  </p>
                  <p className="text-sm text-gray-600">
                    Team members will receive an email invitation to join your
                    business account. They can set their own availability and
                    manage their bookings.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
       </div>
     );
   }
 );

StepTeam.displayName = "StepTeam";

export default StepTeam;

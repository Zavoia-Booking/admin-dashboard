import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../../../shared/components/ui/button';
import { getServicesListSelector } from '../../services/selectors';
import { selectTeamMembers } from '../../teamMembers/selectors';
import { editAssignmentAction, toggleEditAssignmentFormAction } from '../actions';
import type { Service } from '../../../shared/types/service';
import type { TeamMember } from '../../../shared/types/team-member';
import { BaseSlider } from "../../../shared/components/common/BaseSlider.tsx";
import { Input } from "../../../shared/components/ui/input.tsx";
import { Card, CardContent } from '../../../shared/components/ui/card.tsx';
import { Label } from "@radix-ui/react-label";
import { Switch } from "../../../shared/components/ui/switch.tsx";
import type { AssignmentFormData, AssignmentItem, AssignmentRequestPayload } from "../types";
import { Clock5, DollarSign  } from "lucide-react";
import { Controller, useForm } from 'react-hook-form';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  item: AssignmentItem | null
}

const EditAssignmentSlider: React.FC<IProps> = ({ isOpen, onClose, item }) => {
  const dispatch = useDispatch();
  const services: Service[] = useSelector(getServicesListSelector);
  const teamMembers: TeamMember[] = useSelector(selectTeamMembers);
  const { register, handleSubmit, reset, watch, control } = useForm<AssignmentFormData>({
    defaultValues: {
      serviceId: null,
      userId: null,
      customPrice: false,
      customDuration: false,
      customPriceValue: 0,
      customDurationValue: 0,
    }
  });

  useEffect(() => {
    const payload: AssignmentFormData =  item ? {
      serviceId: item.service.id,
      userId: item.user.id,
      customPrice: !!item.customPrice,
      customDuration: !!item.customDuration,
      customPriceValue: item.customPrice || 0,
      customDurationValue: item.customDuration || 0,
    } : {
      serviceId: null,
      userId: null,
      customPrice: false,
      customDuration: false,
      customPriceValue: 0,
      customDurationValue: 0,
    };
    reset(payload);
  }, [item, reset]);

  const watchedServiceId = watch('serviceId');
  const selectedService = services.find(s => s.id === (watchedServiceId ?? -1)) || null;

  const onSubmit = handleSubmit((data) => {
    const { userId, serviceId, customDuration, customPrice, customPriceValue, customDurationValue } = data;

    if (!userId || !serviceId) {
      return;
    }

    const payload: AssignmentRequestPayload = {
      userId,
      serviceId,
      customDuration: customDuration ? customDurationValue : null,
      customPrice: customPrice ? customPriceValue : null,
    };

    dispatch(editAssignmentAction.request(payload));
    dispatch(toggleEditAssignmentFormAction({ open: false, item: null }));
  });

  return (
    <>
      <BaseSlider
          isOpen={isOpen}
          onClose={onClose}
          title="Add New Assignment"
          contentClassName="bg-muted/50 scrollbar-hide"
          footer={
            <div className="flex gap-3">
              <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
              >
                Cancel
              </Button>
              <Button
                  type="submit"
                  form="edit-assignment-form"
                  className="flex-1"
              >
                Edit Assignment
              </Button>
            </div>
          }
      >
        <form id="edit-assignment-form" className="max-w-md mx-auto" onSubmit={onSubmit}>
          <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm transition-all duration-300">
            <CardContent className="space-y-8">
              {/* Service Selector */}
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <select
                    id="service"
                    className="w-full border rounded px-3 py-2"
                    {...register('serviceId', { valueAsNumber: true, required: true })}
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - ${service.price} ({service.duration}min)
                      </option>
                  ))}
                </select>
              </div>

              {/* User Selector */}
              <div className="space-y-2">
                <Label htmlFor="user">Team Member</Label>
                <select
                    id="user"
                    className="w-full border rounded px-3 py-2"
                    {...register('userId', { valueAsNumber: true, required: true })}
                >
                  <option value="">Select a team member</option>
                  {teamMembers
                      .filter(member => member.status === 'active')
                      .map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.firstName} {member.lastName} ({member.email})
                          </option>
                      ))}
                </select>
              </div>

              {/* Custom Price Option */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    control={control}
                    name="customPrice"
                    render={({ field: { value, onChange } }) => (
                      <Switch
                        id="useCustomPrice"
                        checked={!!value}
                        onCheckedChange={onChange}
                      />
                    )}
                  />
                  <Label htmlFor="useCustomPrice">Use custom price</Label>
                </div>
              </div>

              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className={
                  `p-2 rounded-xl
                   ${!watch('customPrice') ? 'bg-green-100': 'bg-gray-100' } 
                   ${!watch('customPrice') ? 'dark:bg-green-900/20': 'dark:bg-gray-900/20' } 
                  `}>
                  <DollarSign className={
                    `h-5 w-5 
                    ${!watch('customPrice') ? 'text-green-600': 'text-gray-600' } 
                    ${!watch('customPrice') ? 'dark:text-green-400': 'dark:text-gray-400'}`
                  }/>
                </div>
                <div className="text-base font-semibold text-foreground">
                  <p className="text-sm">Price: ${selectedService?.price}</p>
                </div>
              </div>

              {/* Custom Price Input */}
              {watch('customPrice') && (
                  <div className="space-y-2">
                    <Label htmlFor="customPrice">Custom Price</Label>
                    <Input
                        id="customPrice"
                        type="number"
                        placeholder="Custom price"
                        min="0"
                        step="0.01"
                        {...register('customPriceValue', { valueAsNumber: true })}
                    />
                  </div>
              )}

              {/* Custom Duration Option */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    control={control}
                    name="customDuration"
                    render={({ field: { value, onChange } }) => (
                      <Switch
                        id="useCustomDuration"
                        checked={!!value}
                        onCheckedChange={onChange}
                      />
                    )}
                  />
                  <Label htmlFor="useCustomDuration">Use custom duration</Label>
                </div>
              </div>

              {/* Custom Duration Input */}
              {watch('customDuration') && (
                  <div className="space-y-2">
                    <Label htmlFor="customDuration">Custom Duration</Label>
                    <Input
                        id="customDuration"
                        type="number"
                        placeholder="Custom duration (minutes)"
                        min="1"
                        {...register('customDurationValue', { valueAsNumber: true })}
                    />
                  </div>
              )}

              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <Clock5 className="h-5 w-5 text-green-600 dark:text-green-400"/>
                </div>
                <div className="text-base font-semibold text-foreground">
                  <p className="text-sm">Duration: {selectedService?.duration} minutes</p>
                </div>
              </div>

            </CardContent>
          </Card>
        </form>
      </BaseSlider>
    </>
  );
}

export default EditAssignmentSlider;
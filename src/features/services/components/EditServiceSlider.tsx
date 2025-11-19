import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { DollarSign, FileText, Settings, MapPin, Users, X, Plus } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Switch } from '../../../shared/components/ui/switch';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../shared/components/ui/command';
import { Badge } from '../../../shared/components/ui/badge';
import { getAllLocationsSelector } from '../../locations/selectors';
import { selectTeamMembers } from '../../teamMembers/selectors';
import { listLocationsAction } from '../../locations/actions';
import { listTeamMembersAction } from '../../teamMembers/actions';
import type { Service } from '../../../shared/types/service';
import type { EditServicePayload } from '../types.ts';
import { editServicesAction } from '../actions.ts';
import { getEditFormSelector } from '../selectors.ts';
import { CategorySection } from './CategorySection';
import ConfirmDialog from '../../../shared/components/common/ConfirmDialog';
import { PriceField } from '../../../shared/components/forms/fields/PriceField';
import { getCurrencyDisplay } from '../../../shared/utils/currency';
import { priceToStorage } from '../../../shared/utils/currency';
import { selectCurrentUser } from '../../auth/selectors';

interface EditServiceSliderProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

const EditServiceSlider: React.FC<EditServiceSliderProps> = ({
  isOpen,
  onClose,
  service: serviceProp
}) => {
  const text = useTranslation('services').t;
  const dispatch = useDispatch();
  const allLocations = useSelector(getAllLocationsSelector);
  const allTeamMembers = useSelector(selectTeamMembers);
  const editForm = useSelector(getEditFormSelector);
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || 'eur';
  
  // Use service from Redux state (fetched via getServiceById) or fallback to prop
  const service = editForm.item || serviceProp;
  
  // Convert decimal price from backend to cents for form
  const getPriceInCents = (decimalPrice: number | undefined): number => {
    if (!decimalPrice) return 0;
    return priceToStorage(decimalPrice, businessCurrency);
  };
  
  const { register, handleSubmit, reset, setValue, getValues, watch } = useForm<EditServicePayload>({
    defaultValues: {
      id: service?.id ?? 0,
      name: service?.name ?? '',
      description: service?.description ?? '',
      duration: service?.duration ?? 0,
      price_amount_minor: getPriceInCents(service?.price),
      isActive: service?.isActive ?? true,
      locations: service?.locations?.map(l => l.id) ?? [],
      teamMembers: service?.teamMembers?.map(tm => tm.id) ?? [],
      categoryId: service?.category?.id ?? null,
    }
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [teamMemberOpen, setTeamMemberOpen] = useState(false);
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  
  const locationIds = watch('locations') || [];
  const teamMemberIds = watch('teamMembers') || [];
  const categoryId = watch('categoryId');

  // Fetch locations and team members when slider opens
  useEffect(() => {
    if (isOpen) {
      dispatch(listLocationsAction.request());
      dispatch(listTeamMembersAction.request());
    }
  }, [isOpen, dispatch]);

  // Populate form with service data when opened
  useEffect(() => {
    if (service && isOpen) {
      reset({
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price_amount_minor: getPriceInCents(service.price),
        isActive: service.isActive,
        locations: service.locations?.map(l => l.id) ?? [],
        teamMembers: service.teamMembers?.map(tm => tm.id) ?? [],
        categoryId: service.category?.id ?? null,
      });
    }
  }, [service, isOpen, reset, businessCurrency]);

  // Reset form when slider closes (with delay to allow closing animation)
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => reset(), 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, reset]);

  const onSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = () => {
    const { id, name, description, duration, price_amount_minor, isActive, locations, teamMembers, categoryId } = getValues();
    const payload: EditServicePayload = {
      id,
      name,
      description,
      duration,
      price_amount_minor: price_amount_minor || 0,
      isActive,
      locations: locations && locations.length > 0 ? locations : undefined,
      teamMembers: teamMembers && teamMembers.length > 0 ? teamMembers : undefined,
      categoryId: categoryId ?? null,
    };
    dispatch(editServicesAction.request(payload));
    setShowConfirmDialog(false);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!service) return null;

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title={text('editService.title')}
        contentClassName="bg-muted/50 scrollbar-hide"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              {text('editService.buttons.cancel')}
            </Button>
            <Button
              type="submit"
              form="edit-service-form"
              className="flex-1"
            >
              {text('editService.buttons.update')}
            </Button>
          </div>
        }
      >
        <form id="edit-service-form" onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
          <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm transition-all duration-300">
            <CardContent className="space-y-8">
              {/* Service Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{text('editService.sections.serviceInfo')}</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">{text('editService.form.name.label')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={text('editService.form.name.placeholder')}
                    {...register('name', { required: true })}
                    className="h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-foreground">{text('editService.form.description.label')}</Label>
                  <Textarea
                    id="description"
                    placeholder={text('editService.form.description.placeholder')}
                    {...register('description')}
                    rows={3}
                    className="min-h-[80px] text-base border-border/50 bg-background/50 backdrop-blur-sm resize-none"
                  />
                </div>
              </div>

              {/* Pricing & Duration Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-green-50 dark:bg-success-bg">
                    <DollarSign className="h-5 w-5 text-green-400 dark:text-success" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{text('editService.sections.pricingDuration')}</h3>
                </div>
                <div className="mb-2 text-xs text-muted-foreground">
                  All assigned team members will use this price and duration unless a custom value is set for them below.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <PriceField
                      value={watch('price_amount_minor') || 0}
                      onChange={(value) => setValue('price_amount_minor', typeof value === 'number' ? value : 0)}
                      label={text('editService.form.price.label')}
                      placeholder={text('editService.form.price.placeholder')}
                      required
                      id="price"
                      min={0}
                      step={0.01}
                      icon={getCurrencyDisplay(businessCurrency).icon}
                      symbol={getCurrencyDisplay(businessCurrency).symbol}
                      iconPosition="left"
                      decimalPlaces={2}
                      currency={businessCurrency}
                      storageFormat="cents"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium text-foreground">{text('editService.form.duration.label')}</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      step="1"
                      placeholder={text('editService.form.duration.placeholder')}
                      {...register('duration', { required: true, valueAsNumber: true, min: 1 })}
                      className="h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Locations Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Locations</h3>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Available Locations</Label>
                  <div className="space-y-2">
                    {locationIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {locationIds.map((locationId: number) => {
                          const location = allLocations.find(l => l.id === locationId);
                          if (!location) return null;
                          return (
                            <Badge
                              key={locationId}
                              variant="secondary"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              {location.name}
                              <button
                                type="button"
                                onClick={() => {
                                  setValue('locations', locationIds.filter(id => id !== locationId));
                                }}
                                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {locationIds.length === 0 ? 'Add Locations' : 'Add More Locations'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0 z-[80]">
                        <Command>
                          <CommandInput placeholder="Search locations..." />
                          <CommandList>
                            <CommandEmpty>No locations found.</CommandEmpty>
                            <CommandGroup>
                              {allLocations.map((location) => {
                                const isSelected = locationIds.includes(location.id);
                                return (
                                  <CommandItem
                                    key={location.id}
                                    value={location.name}
                                    onSelect={() => {
                                      const newIds = isSelected
                                        ? locationIds.filter((id: number) => id !== location.id)
                                        : [...locationIds, location.id];
                                      setValue('locations', newIds);
                                    }}
                                    className="flex items-center gap-3 p-3"
                                  >
                                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                                      isSelected ? 'bg-primary border-primary' : 'border-border'
                                    }`}>
                                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </div>
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="flex-1">{location.name}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {locationIds.length === 0 && (
                      <p className="text-xs text-muted-foreground">If no locations are selected, service will be available at all locations</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Members Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Team Members</h3>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Assigned Team Members</Label>
                  <div className="space-y-2">
                    {teamMemberIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {teamMemberIds.map((memberId: number) => {
                          const member = allTeamMembers.find((m: any) => m.id === memberId);
                          if (!member) return null;
                          return (
                            <Badge
                              key={memberId}
                              variant="secondary"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
                            >
                              <Users className="h-3.5 w-3.5" />
                              {member.firstName} {member.lastName}
                              <button
                                type="button"
                                onClick={() => {
                                  setValue('teamMembers', teamMemberIds.filter((id: number) => id !== memberId));
                                }}
                                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    <Popover open={teamMemberOpen} onOpenChange={setTeamMemberOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {teamMemberIds.length === 0 ? 'Add Team Members' : 'Add More Team Members'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0 z-[80]">
                        <Command>
                          <CommandInput placeholder="Search team members..." />
                          <CommandList>
                            <CommandEmpty>No team members found.</CommandEmpty>
                            <CommandGroup>
                              {allTeamMembers.map((member: any) => {
                                const isSelected = teamMemberIds.includes(member.id);
                                return (
                                  <CommandItem
                                    key={member.id}
                                    value={`${member.firstName} ${member.lastName}`}
                                    onSelect={() => {
                                      const newIds = isSelected
                                        ? teamMemberIds.filter((id: number) => id !== member.id)
                                        : [...teamMemberIds, member.id];
                                      setValue('teamMembers', newIds);
                                    }}
                                    className="flex items-center gap-3 p-3"
                                  >
                                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                                      isSelected ? 'bg-primary border-primary' : 'border-border'
                                    }`}>
                                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </div>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="flex-1">{member.firstName} {member.lastName}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {teamMemberIds.length === 0 && (
                      <p className="text-xs text-muted-foreground">If no team members are selected, service will be available to all team members</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Section */}
              <CategorySection
                categoryId={categoryId}
                categoryName={service.category?.name}
                categoryColor={service.category?.color}
                onCategoryIdChange={(value) => setValue('categoryId', value)}
                onCategoryNameChange={() => {}} // Not used in edit mode
                onCategoryColorChange={() => {}} // Not used in edit mode
                expanded={categoryExpanded}
                onExpandedChange={setCategoryExpanded}
                mode="edit"
                existingCategoryName={service.category?.name}
              />

              {/* Service Settings Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{text('editService.sections.settings')}</h3>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">{text('editService.form.status.label')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {watch('isActive') === true
                        ? text('editService.form.status.activeDescription')
                        : text('editService.form.status.inactiveDescription')}
                    </p>
                  </div>
                  <Switch
                    checked={watch('isActive') === true}
                    onCheckedChange={(checked) => setValue('isActive', checked ? true : false)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </BaseSlider>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmUpdate}
        onCancel={() => setShowConfirmDialog(false)}
        title={text('editService.confirmDialog.title')}
        description={text('editService.confirmDialog.description', { name: getValues('name') })}
        confirmTitle={text('editService.confirmDialog.confirm')}
        cancelTitle={text('editService.confirmDialog.cancel')}
      />
    </>
  );
};

export default EditServiceSlider; 
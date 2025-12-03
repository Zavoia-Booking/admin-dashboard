import type { LocationType } from "../../shared/types/location";

export const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper to get short day names
export const shortDay = (day: string) => {
    const map: Record<string, string> = {
        monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
    };
    return map[day.toLowerCase()] || day;
};

export const mapLocationForEdit = (location: LocationType): any => {
    return {
        id: location.id,
        name: location.name,
        address: location.address,
        email: location.email,
        phone: location.phone,
        description: location.description,
        timezone: location.timezone,
        isRemote: location.isRemote,
        workingHours: location.workingHours,
        open247: location.open247,
        mapPinConfirmed: location.mapPinConfirmed,
        addressComponents: (location as any).addressComponents,
        addressManualMode: (location as any).addressManualMode,
    };
}
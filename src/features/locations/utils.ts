// Helper to capitalize day names
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
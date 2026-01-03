/**
 * Shared utility functions for data processing and aggregation across dashboards.
 */

/**
 * Aggregates a list of records by a specific field name.
 * Useful for merging duplicate province or school data.
 */
export const groupByName = <T extends Record<string, any>>(
    data: T[],
    nameField: keyof T,
    numericFields: (keyof T)[]
): Record<string, any>[] => {
    const map = data.reduce((acc, curr) => {
        const name = String(curr[nameField] || 'Unknown');
        if (!acc[name]) {
            acc[name] = { name };
            numericFields.forEach(f => {
                acc[name][String(f)] = 0;
            });
        }
        numericFields.forEach(f => {
            acc[name][String(f)] += Number(curr[f] || 0);
        });
        return acc;
    }, {} as Record<string, any>);

    return Object.values(map);
};

/**
 * Samples a large dataset for charts to ensure performance.
 */
export const sampleData = <T>(data: T[], limit: number = 400): T[] => {
    if (data.length <= limit) return data;
    const step = Math.ceil(data.length / limit);
    return data.filter((_, i) => i % step === 0);
};

/**
 * Calculates a basic pass rate percentage.
 */
export const calculatePassRate = (data: { gpa_overall?: number }[], threshold: number = 5.0): number => {
    if (data.length === 0) return 0;
    const passing = data.filter(d => (d.gpa_overall || 0) >= threshold).length;
    return Math.round((passing / data.length) * 100);
};

/**
 * Formats a number to 1 decimal place safely.
 */
export const formatOneDecimal = (val: any): string => {
    const num = Number(val);
    return isNaN(num) ? '0.0' : num.toFixed(1);
};

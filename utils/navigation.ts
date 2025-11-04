export type RawSearchParams = Record<string, string | string[] | undefined>;

export const normalizeSearchParams = (params: RawSearchParams): Record<string, string> => {
  return Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'undefined') {
      return acc;
    }

    acc[key] = Array.isArray(value) ? value[0] : value;
    return acc;
  }, {});
};

export const parsePrice = (value: string): number => {
  const normalized = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const strings: { [key: string]: string } = {};

export const setLocale = (data: { [key: string]: string }) => {
  for (const key in data) strings[key] = data[key];
};

export const Locale = (key: string, fallback: string): string => strings[key] || fallback;
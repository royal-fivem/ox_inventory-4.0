export let imagepath = 'images';
export let imageformat = 'png';

export function setImagePath(path: string) {
  if (path && path !== '') imagepath = path;
}

export const setImageFormat = (format?: string) => {
  if (format && format !== '') imageformat = format;
};

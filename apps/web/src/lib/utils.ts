import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Template convention: always merge classNames through cn(), never concatenate manually. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

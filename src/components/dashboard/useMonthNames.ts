import { useTranslation } from 'react-i18next';
import { MONTH_KEYS } from '@/i18n/calendar';

export function useMonthNames() {
  const { t } = useTranslation();
  const names = MONTH_KEYS.map((key) => t(`months.short.${key}`));
  const abbreviations = names.map((name) => name.charAt(0));
  return { names, abbreviations };
}

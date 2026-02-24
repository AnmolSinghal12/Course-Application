import { useMemo } from 'react';
import { usePreferences } from '@/contexts/preferences-context';
import { getTranslation, Language } from '@/lib/translations';

export function useTranslation() {
  const { preferences } = usePreferences();
  const language = (preferences.language === 'hi' ? 'hi' : 'en') as Language;

  const t = useMemo(
    () => (key: string): string => {
      return getTranslation(language, key);
    },
    [language]
  );

  return { t, language };
}

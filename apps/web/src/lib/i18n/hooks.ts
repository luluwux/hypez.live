import { useLanguageContext, type Language, type LanguageContextType } from "./context";
import en from "./translations/en.json";
import tr from "./translations/tr.json";
// Non-TR/EN translations disabled until i18n completion
const translations: Record<Language, typeof en> = {
    en,
    tr,
    // Fallback non-TR/EN to English
    zh: en,
    hi: en,
    es: en,
    fr: en,
    ar: en,
    bn: en,
    ru: en,
    pt: en,
};

export function useLanguage() {
    return useLanguageContext();
}

export function useTranslation() {
    const { language } = useLanguageContext();

    const t = (key: string, params?: Record<string, string | number>): string => {
        const keys = key.split(".");
        let value: any = translations[language];

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) {
                console.warn(`Translation missing: ${key} for ${language}`);
                return key;
            }
        }

        let result = value as string;

        // Interpolation
        if (params) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                result = result.replace(`{${paramKey}}`, String(paramValue));
            });
        }

        return result;
    };

    return { t, language };
}

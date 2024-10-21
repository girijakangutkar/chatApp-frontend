import { translate, languages } from "google-translate-api-x";

// Create a cache for translations
const translationCache = new Map();

export async function translateText(text, targetLang) {
  const cacheKey = `${text}|${targetLang}`;

  // Check if translation is in cache
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const result = await translate(text, { to: targetLang });

    // Cache the result
    translationCache.set(cacheKey, result.text);

    return result.text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}

// Export the list of supported languages
export const supportedLanguages = Object.entries(languages).map(
  ([code, name]) => ({
    code: code,
    name: name,
  })
);

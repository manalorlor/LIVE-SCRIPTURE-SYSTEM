import { Verse, ScriptureReference } from '../types';

const BASE_URL = 'https://bible-api.com';

export const fetchVerse = async (ref: ScriptureReference, customTitle?: string): Promise<Verse | null> => {
  try {
    const query = ref.verse 
      ? `${ref.book} ${ref.chapter}:${ref.verse}`
      : `${ref.book} ${ref.chapter}`;
      
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`${BASE_URL}/${encodedQuery}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch verse: ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!data.text) {
      return null;
    }

    return {
      reference: data.reference,
      text: data.text.trim(),
      translation_name: data.translation_name,
      book_name: data.verses?.[0]?.book_name,
      chapter: data.verses?.[0]?.chapter,
      verse: data.verses?.[0]?.verse,
      title: customTitle // Pass through the custom title if provided (e.g. "The Good Samaritan")
    };
  } catch (error) {
    console.error("Error fetching verse:", error);
    return null;
  }
};
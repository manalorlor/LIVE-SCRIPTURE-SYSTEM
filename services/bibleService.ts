import { Verse, ScriptureReference } from '../types';
import { GoogleGenAI } from '@google/genai';

const BASE_URL = 'https://bible-api.com';

// Helper: Retry fetch on network failure
const fetchWithRetry = async (url: string, retries = 2, delay = 500): Promise<Response> => {
    try {
        return await fetch(url);
    } catch (err) {
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, retries - 1, delay * 2);
    }
};

export const fetchVerse = async (ref: ScriptureReference, customTitle?: string, version: string = 'NKJV'): Promise<Verse | null> => {
  try {
    // 1. Try Gemini for modern translations (NKJV, NLT, etc.)
    if (process.env.API_KEY && ['NKJV', 'NLT', 'NIV', 'ESV'].includes(version)) {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const query = ref.verse 
                ? `${ref.book} ${ref.chapter}:${ref.verse}`
                : `${ref.book} ${ref.chapter}`;

            const prompt = `You are a Bible API. Provide the text for ${query} in the ${version} translation. 
            Rules:
            1. Return ONLY the scripture text. 
            2. Do not include the reference in the output text.
            3. Do not include "Here is the verse" or quotes unless part of the scripture.
            4. If the verse doesn't exist, return "NOT_FOUND".`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const text = response.text?.trim();

            if (text && text !== 'NOT_FOUND') {
                return {
                    reference: query,
                    text: text,
                    translation_name: version,
                    book_name: ref.book,
                    chapter: ref.chapter,
                    verse: ref.verse ? parseInt(ref.verse.toString().split('-')[0]) : undefined,
                    title: customTitle
                };
            }
        } catch (geminiError) {
            console.warn(`Gemini fetch for ${version} failed, falling back to public API.`);
        }
    }

    // 2. Fallback to Bible-API.com
    let apiTranslation = 'web';
    if (version === 'KJV') apiTranslation = 'kjv';

    const query = ref.verse 
      ? `${ref.book} ${ref.chapter}:${ref.verse}`
      : `${ref.book} ${ref.chapter}`;
      
    const encodedQuery = encodeURIComponent(query);
    const url = `${BASE_URL}/${encodedQuery}?translation=${apiTranslation}`;
    
    // Use retry logic to handle temporary network issues
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch verse from API: ${response.status} ${response.statusText}`);
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
      title: customTitle 
    };
  } catch (error) {
    console.error("Error fetching verse:", error);
    // Return a visible error to the user so they know what happened
    return {
        reference: "Network Error",
        text: "Unable to retrieve scripture. Please check your internet connection.",
        translation_name: "System",
        book_name: "Error",
        chapter: 0,
        verse: 0,
        title: "Connection Issue"
    };
  }
};
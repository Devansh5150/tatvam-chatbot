'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, dictionaries } from './dictionaries'

type LanguageContextType = {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: keyof typeof dictionaries['en'] | `moods.${keyof typeof dictionaries['en']['moods']}`) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en')

    useEffect(() => {
        const savedLang = localStorage.getItem('tatvam_ui_lang') as Language
        if (savedLang && Object.keys(dictionaries).includes(savedLang)) {
            setLanguageState(savedLang)
        }
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem('tatvam_ui_lang', lang)
    }

    const t = (key: string): string => {
        const dictionary = dictionaries[language]
        
        // Handle nested keys like "moods.anxious"
        if (key.startsWith('moods.')) {
            const moodKey = key.split('.')[1] as keyof typeof dictionary['moods']
            return dictionary.moods[moodKey] || key
        }
        
        return (dictionary as any)[key] || key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

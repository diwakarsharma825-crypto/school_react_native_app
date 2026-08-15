import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'hi';

const LANGUAGE_KEY = 'app_language_preference';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Nav & Common
    home: 'Home',
    result: 'Result',
    gallery: 'Gallery',
    more: 'More',
    login: 'Login',
    logout: 'Logout',
    profile: 'Profile',
    homework: 'Homework',
    attendance: 'Attendance',
    notices: 'Notices',
    announcements: 'Announcements',
    events: 'Events',
    news: 'News',
    holidays: 'Holidays',
    apply_leave: 'Apply Leave',
    leave_applications: 'Leave Applications',
    fees: 'Fees & Invoices',
    syllabus: 'Syllabus',
    teachers: 'Teachers',
    top_students: 'Top Achievers',
    about_us: 'About Us',
    contact_us: 'Contact Us',
    disclosures: 'Mandatory Disclosures',
    storage_usage: 'Storage Usage',
    teacher_portal: 'Teacher Portal',
    student_portal: 'Student Portal',
    change_password: 'Change Password',

    // Titles & Banners
    principal_message: "Principal's Message",
    latest_events: 'Latest Events',
    school_achievers: 'School Achievers',
    quick_access: 'Quick Access',
    account_pending: 'Account Pending Activation',

    // Actions & Buttons
    submit: 'Submit',
    cancel: 'Cancel',
    download: 'Download',
    export_pdf: 'Export PDF',
    export_csv: 'Export CSV',
    save: 'Save',
    search: 'Search...',
    filter: 'Filter',
    select_class: 'Select Class',
    select_section: 'Select Section',
    select_subject: 'Select Subject',
    switch_language: 'हिन्दी में देखें',

    // Statuses
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    present: 'Present',
    absent: 'Absent',
    leave: 'Leave',
  },
  hi: {
    // Nav & Common
    home: 'मुख्य पृष्ठ',
    result: 'परीक्षा परिणाम',
    gallery: 'गैलरी',
    more: 'अन्य मेनू',
    login: 'लॉग इन',
    logout: 'लॉग आउट',
    profile: 'प्रोफाइल',
    homework: 'गृहकार्य',
    attendance: 'उपस्थिति',
    notices: 'सूचनाएं',
    announcements: 'घोषणाएं',
    events: 'कार्यक्रम',
    news: 'समाचार',
    holidays: 'अवकाश',
    apply_leave: 'छुट्टी का आवेदन',
    leave_applications: 'अवकाश आवेदन सूची',
    fees: 'शुल्क एवं चालान',
    syllabus: 'पाठ्यक्रम',
    teachers: 'शिक्षक वृंद',
    top_students: 'मेधावी छात्र',
    about_us: 'हमारे बारे में',
    contact_us: 'संपर्क करें',
    disclosures: 'अनिवार्य प्रकटीकरण',
    storage_usage: 'स्टोरेज उपयोग',
    teacher_portal: 'शिक्षक पोर्टल',
    student_portal: 'छात्र पोर्टल',
    change_password: 'पासवर्ड बदलें',

    // Titles & Banners
    principal_message: 'प्राचार्य का संदेश',
    latest_events: 'नवीनतम कार्यक्रम',
    school_achievers: 'विद्यालय के मेधावी छात्र',
    quick_access: 'त्वरित लिंक',
    account_pending: 'खाता सत्यापन लंबित है',

    // Actions & Buttons
    submit: 'सबमिट करें',
    cancel: 'रद्द करें',
    download: 'डाउनलोड करें',
    export_pdf: 'पीडीएफ एक्सपोर्ट',
    export_csv: 'सीएसवी एक्सपोर्ट',
    save: 'सुरक्षित करें',
    search: 'खोजें...',
    filter: 'फ़िल्टर',
    select_class: 'कक्षा चुनें',
    select_section: 'अनुभाग चुनें',
    select_subject: 'विषय चुनें',
    switch_language: 'Switch to English',

    // Statuses
    pending: 'लंबित',
    approved: 'स्वीकृत',
    rejected: 'अस्वीकृत',
    present: 'उपस्थित',
    absent: 'अनुपस्थित',
    leave: 'अवकाश',
  },
};

const DYNAMIC_WORD_MAP: Record<string, string> = {
  // Subjects
  'mathematics': 'गणित',
  'maths': 'गणित',
  'science': 'विज्ञान',
  'general science': 'सामान्य विज्ञान',
  'english': 'अंग्रेजी',
  'english literature': 'अंग्रेजी साहित्य',
  'english grammar': 'अंग्रेजी व्याकरण',
  'hindi': 'हिंदी',
  'social science': 'सामाजिक विज्ञान',
  'social studies': 'सामाजिक अध्ययन',
  'computer science': 'कंप्यूटर विज्ञान',
  'physics': 'भौतिक विज्ञान',
  'chemistry': 'रसायन विज्ञान',
  'biology': 'जीव विज्ञान',
  'economics': 'अर्थशास्त्र',
  'accountancy': 'लेखाशास्त्र',
  'business studies': 'व्यवसाय अध्ययन',
  'history': 'इतिहास',
  'geography': 'भूगोल',
  'political science': 'राजनीति विज्ञान',

  // Common Academic Terms
  'class': 'कक्षा',
  'section': 'अनुभाग',
  'homework': 'गृहकार्य',
  'attendance': 'उपस्थिति',
  'notice': 'सूचना',
  'notices': 'सूचनाएं',
  'announcement': 'घोषणा',
  'announcements': 'घोषणाएं',
  'event': 'कार्यक्रम',
  'events': 'कार्यक्रम',
  'holiday': 'अवकाश',
  'holidays': 'अवकाश',
  'syllabus': 'पाठ्यक्रम',
  'chapter': 'अध्याय',
  'topic': 'विषय',
  'fee': 'शुल्क',
  'fees': 'शुल्क',
  'invoice': 'चालान',
  'invoices': 'चालान',
  'amount': 'राशि',
  'discount': 'छूट',
  'reason': 'कारण',
  'status': 'स्थिति',
  'due': 'देय',
  'paid': 'भुगतान',
  'unpaid': 'अदत्त',
  'present': 'उपस्थित',
  'absent': 'अनुपस्थित',
  'leave': 'अवकाश',
  'pending': 'लंबित',
  'approved': 'स्वीकृत',
  'rejected': 'अस्वीकृत',
  'teacher': 'शिक्षक',
  'tutor': 'ट्यूटर',
  'student': 'छात्र',
  'learner': 'शिक्षार्थी',
  'principal': 'प्राचार्य',
  'school': 'विद्यालय',
  'institute': 'संस्थान',
  'result': 'परीक्षा परिणाम',
  'report card': 'प्रगति पत्र',
  'top achievers': 'मेधावी छात्र',
  'mandatory disclosures': 'अनिवार्य प्रकटीकरण',
  'about us': 'हमारे बारे में',
  'contact us': 'संपर्क करें',
  'gallery': 'गैलरी',
  'more': 'अन्य',
  'home': 'मुख्य पृष्ठ',
  'login': 'लॉग इन',
  'logout': 'लॉग आउट',
  'profile': 'प्रोफाइल',
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: (keyOrText: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  toggleLanguage: async () => {},
  t: (keyOrText: string) => keyOrText,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((saved) => {
      if (saved === 'hi' || saved === 'en') {
        setLangState(saved);
      }
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLangState(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  };

  const toggleLanguage = async () => {
    const nextLang = language === 'en' ? 'hi' : 'en';
    await setLanguage(nextLang);
  };

  /** Translates any static key OR dynamic text string from backend API */
  const t = (keyOrText: string): string => {
    if (!keyOrText) return '';
    if (language === 'en') {
      return TRANSLATIONS.en[keyOrText] || keyOrText;
    }

    // 1. Direct key match in Hindi translation dictionary
    if (TRANSLATIONS.hi[keyOrText]) {
      return TRANSLATIONS.hi[keyOrText];
    }

    // 2. Direct word/phrase match in Dynamic Word Map
    const normalized = keyOrText.toLowerCase().trim();
    if (DYNAMIC_WORD_MAP[normalized]) {
      return DYNAMIC_WORD_MAP[normalized];
    }

    // 3. Smart pattern replacement for dynamic strings (e.g. "Class 10th Mathematics Homework")
    let translated = keyOrText;
    Object.keys(DYNAMIC_WORD_MAP).forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      translated = translated.replace(regex, DYNAMIC_WORD_MAP[word]);
    });

    return translated;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

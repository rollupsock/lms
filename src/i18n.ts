import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "welcome": "Welcome to Madrassa Fikriyya",
      "courses": "Courses",
      "dashboard": "Dashboard",
      "assignments": "Assignments",
      "calendar": "Calendar",
      "messages": "Messages",
      "analytics": "Analytics",
      "enroll": "Enroll",
      "progress": "Progress",
      "grade": "Grade",
      "feedback": "Feedback",
      "submit": "Submit",
      "create_course": "Create Course",
      "student": "Student",
      "teacher": "Teacher",
      "admin": "Admin",
      "parent": "Parent",
      "logout": "Logout",
      "login": "Login",
      "sign_in_google": "Sign in with Google"
    }
  },
  ar: {
    translation: {
      "welcome": "مرحباً بكم في مدرسة فكرية",
      "courses": "الدورات",
      "dashboard": "لوحة القيادة",
      "assignments": "الواجبات",
      "calendar": "التقويم",
      "messages": "الرسائل",
      "analytics": "التحليلات",
      "enroll": "تسجيل",
      "progress": "التقدم",
      "grade": "الدرجة",
      "feedback": "ملاحظات",
      "submit": "إرسال",
      "create_course": "إنشاء دورة",
      "student": "طالب",
      "teacher": "معلم",
      "admin": "مدير",
      "parent": "ولي أمر",
      "logout": "تسجيل الخروج",
      "login": "تسجيل الدخول",
      "sign_in_google": "تسجيل الدخول باستخدام جوجل"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

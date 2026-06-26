export type ProviderId = 'gemini' | 'deepseek';

export interface Experience {
  title: string | null;
  company: string | null;
  duration: string | null;
}

export interface Education {
  school: string | null;
  degree: string | null;
}

export interface Profile {
  name: string | null;
  headline: string | null;
  location: string | null;
  about: string | null;
  currentCompany: string | null;
  currentTitle: string | null;
  experiences: Experience[];
  education: Education[];
  skills: string[];
}

export interface Angle {
  id: string;
  label: string;
  template: string;
}

export interface Settings {
  provider: ProviderId;
  geminiModel: string;
  deepseekModel: string;
  tone: string;
  angles: Angle[];
}

export interface Secrets {
  geminiKey: string;
  deepseekKey: string;
}

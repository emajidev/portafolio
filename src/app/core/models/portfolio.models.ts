export interface Project {
  id: string;
  title: string;
  tagline?: string;
  description: string;
  stack: string[];
  challenges: string;
  results: string;
  github?: string;
  demo?: string;
  tags: string[];
  featured?: boolean;
  image?: string;
  imageAlt?: string;
  accent?: string;
}

export interface Skill {
  name: string;
  level: number;
  icon: string;
  category?: string;
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  technologies: string[];
  impact: string;
  bullets?: string[];
}

export interface AiExperiment {
  title: string;
  status: 'active' | 'beta';
  log: string;
  detail: string;
  stack: string[];
  impact: string;
}

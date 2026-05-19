export interface Project {
  id: string;
  title: string;
  description: string;
  stack: string[];
  challenges: string;
  results: string;
  github?: string;
  demo?: string;
  tags: string[];
  featured?: boolean;
}

export interface Skill {
  name: string;
  level: number;
  icon: string;
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  technologies: string[];
  impact: string;
}

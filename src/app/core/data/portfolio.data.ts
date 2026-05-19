import { Experience, Project, Skill } from '../models/portfolio.models';

export const NAV = [
  { label: 'Proyectos', id: 'projects' },
  { label: 'Skills', id: 'skills' },
  { label: 'Lab IA', id: 'ai-lab' },
  { label: 'Experiencia', id: 'experience' },
  { label: 'Contacto', id: 'contact' },
];

export const SKILLS: Skill[] = [
  { name: 'AWS', level: 92, icon: '☁️' },
  { name: 'Docker', level: 95, icon: '🐳' },
  { name: 'Kubernetes', level: 88, icon: '⎈' },
  { name: 'Terraform', level: 90, icon: '🏗️' },
  { name: 'Python', level: 94, icon: '🐍' },
  { name: 'Angular', level: 91, icon: '🅰️' },
  { name: 'Node.js', level: 89, icon: '🟢' },
  { name: 'AI/ML', level: 87, icon: '🧠' },
];

export const PROJECTS: Project[] = [
  {
    id: '1',
    title: 'AI Pipeline Orchestrator',
    description: 'Orquestador ML con auto-scaling y despliegue en Kubernetes.',
    stack: ['Python', 'K8s', 'TensorFlow'],
    challenges: 'Latencia y costos cloud.',
    results: '60% menos costos, 3x throughput.',
    tags: ['IA', 'DevOps'],
    featured: true,
  },
  {
    id: '2',
    title: 'Infra-as-Code Platform',
    description: 'Plataforma multi-tenant con Terraform y políticas OPA.',
    stack: ['Terraform', 'AWS', 'Go'],
    challenges: 'Drift y compliance.',
    results: 'Deploy <5 min, 99.9% compliance.',
    tags: ['Cloud'],
    featured: true,
  },
  {
    id: '3',
    title: 'RAG Enterprise Chatbot',
    description: 'Asistente corporativo con embeddings y guardrails.',
    stack: ['Python', 'LangChain', 'FastAPI'],
    challenges: 'Alucinaciones y latencia.',
    results: '95% precisión documentada.',
    tags: ['IA', 'NLP'],
  },
];

export const EXPERIENCES: Experience[] = [
  {
    company: 'TechCorp Global',
    role: 'Senior Backend & DevOps',
    period: '2022 — Presente',
    technologies: ['AWS', 'K8s', 'Python'],
    impact: 'Migración cloud-native, -45% costos.',
  },
  {
    company: 'AI Startup Labs',
    role: 'ML Platform Engineer',
    period: '2020 — 2022',
    technologies: ['Python', 'TensorFlow', 'Docker'],
    impact: '2M+ predicciones/día.',
  },
];

export const MASCOT_MSGS = [
  'Hey 👋 bienvenido a mi universo tech',
  'Explora mis proyectos 🚀',
  '¿Listo para construir el futuro?',
];

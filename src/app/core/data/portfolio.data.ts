import { Experience, Project, Skill } from '../models/portfolio.models';

export const NAV = [
  { label: 'Proyectos IA', id: 'projects' },
  { label: 'DevOps', id: 'skills' },
  { label: 'Lab IA', id: 'ai-lab' },
  { label: 'Experiencia', id: 'experience' },
  { label: 'Contacto', id: 'contact' },
];

export const HERO_TECH = [
  { id: 'ai', label: 'IA / ML', icon: '🧠', x: 68, y: 12 },
  { id: 'aws', label: 'AWS', icon: '☁️', x: 88, y: 28 },
  { id: 'tf', label: 'Terraform', icon: '🏗️', x: 72, y: 42 },
  { id: 'py', label: 'Python', icon: '🐍', x: 90, y: 55 },
  { id: 'docker', label: 'Docker', icon: '🐳', x: 75, y: 68 },
];

export const SKILLS: Skill[] = [
  { name: 'AWS', level: 92, icon: '☁️', category: 'cloud' },
  { name: 'Docker', level: 95, icon: '🐳', category: 'devops' },
  { name: 'Kubernetes', level: 88, icon: '⎈', category: 'devops' },
  { name: 'Terraform', level: 90, icon: '🏗️', category: 'devops' },
  { name: 'Python', level: 94, icon: '🐍', category: 'backend' },
  { name: 'Angular', level: 91, icon: '🅰️', category: 'backend' },
  { name: 'Node.js', level: 89, icon: '🟢', category: 'backend' },
  { name: 'AI/ML', level: 87, icon: '🧠', category: 'ai' },
  { name: 'PostgreSQL', level: 90, icon: '🐘', category: 'data' },
  { name: 'GitHub Actions', level: 93, icon: '⚡', category: 'devops' },
];

export const PROJECTS: Project[] = [
  {
    id: '1',
    title: 'AI Pipeline Orchestrator',
    description: 'Orquestador de pipelines ML con auto-scaling, monitoreo y despliegue continuo en Kubernetes.',
    stack: ['Python', 'K8s', 'TensorFlow', 'ArgoCD'],
    challenges: 'Latencia en inferencia batch y costos cloud elevados.',
    results: 'Reducción del 60% en costos y 3x throughput.',
    tags: ['IA', 'DevOps', 'K8s'],
    featured: true,
  },
  {
    id: '2',
    title: 'Infra-as-Code Platform',
    description: 'Plataforma multi-tenant para provisionar infraestructura con Terraform y políticas OPA.',
    stack: ['Terraform', 'AWS', 'Go', 'PostgreSQL'],
    challenges: 'Drift detection y compliance en entornos regulados.',
    results: 'Deploy de infra en <5 min con 99.9% compliance.',
    tags: ['Cloud', 'DevOps'],
    featured: true,
  },
  {
    id: '3',
    title: 'RAG Enterprise Chatbot',
    description: 'Asistente corporativo con RAG, embeddings vectoriales y guardrails de seguridad.',
    stack: ['Python', 'LangChain', 'FastAPI'],
    challenges: 'Alucinaciones y latencia en consultas complejas.',
    results: '95% precisión en respuestas documentadas.',
    tags: ['IA', 'NLP'],
  },
  {
    id: '4',
    title: 'Observability Stack',
    description: 'Stack de observabilidad con Prometheus, Grafana y alertas inteligentes con ML.',
    stack: ['Prometheus', 'Grafana', 'Python'],
    challenges: 'Alert fatigue y correlación de incidentes.',
    results: 'MTTR reducido en 70%.',
    tags: ['SRE'],
  },
  {
    id: '5',
    title: 'CI/CD Matrix Engine',
    description: 'Motor de pipelines paralelos con caching inteligente y preview environments.',
    stack: ['GitHub Actions', 'Node.js', 'Docker'],
    challenges: 'Build times y flaky tests en monorepos.',
    results: 'Builds 4x más rápidos.',
    tags: ['CI/CD'],
  },
  {
    id: '6',
    title: 'Smart API Gateway',
    description: 'Gateway con rate limiting adaptativo, auth JWT y métricas en tiempo real.',
    stack: ['Node.js', 'Redis', 'Kong'],
    challenges: 'Rate limiting justo bajo picos de tráfico.',
    results: '50K RPS con p99 < 100ms.',
    tags: ['Backend'],
  },
];

export const EXPERIENCES: Experience[] = [
  {
    company: 'TechCorp Global',
    role: 'Senior Backend & DevOps Engineer',
    period: '2022 — Presente',
    technologies: ['AWS', 'K8s', 'Python', 'Terraform'],
    impact: 'Lideré migración cloud-native reduciendo costos 45%.',
  },
  {
    company: 'AI Startup Labs',
    role: 'ML Platform Engineer',
    period: '2020 — 2022',
    technologies: ['Python', 'TensorFlow', 'Docker'],
    impact: 'Pipelines ML con 2M+ predicciones/día.',
  },
  {
    company: 'FinTech Solutions',
    role: 'Backend Developer',
    period: '2018 — 2020',
    technologies: ['Node.js', 'PostgreSQL', 'Redis'],
    impact: 'APIs con 99.99% uptime.',
  },
];

export const AI_EXPERIMENTS = [
  { title: "Claw'd Copilot v2", status: 'active', log: '[OK] Copilot online — 128k context' },
  { title: 'Auto-Deploy Bot', status: 'active', log: '[SCAN] Analyzing 3 open PRs...' },
  { title: 'Log Anomaly Detector', status: 'beta', log: '[ML] Precision: 0.94 | Recall: 0.91' },
  { title: 'Code Review AI', status: 'beta', log: '[REVIEW] PR #142 — 3 suggestions' },
];

export const MASCOT_MSGS = [
  '¡Hola! Soy Claw\'d, tu copiloto personal 🤖',
  'Explora mis proyectos, experimentos e ideas 🚀',
  'Scroll para ver algo increíble ↓',
  '¿Listo para construir el futuro?',
  'Actualmente cocinando ideas con IA...',
];

export const ABOUT_CARDS = [
  { icon: '⚡', title: 'Experiencia', desc: '8+ años en backend, cloud e IA en producción.' },
  { icon: '🎯', title: 'Filosofía', desc: 'Código limpio, infra automatizada, impacto medible.' },
  { icon: '🛠️', title: 'Stack', desc: 'Python, Angular, AWS, K8s, Terraform, ML pipelines.' },
  { icon: '🚀', title: 'Objetivos', desc: 'Democratizar IA en producción sin fricción.' },
  { icon: '💎', title: 'Especialidades', desc: 'Cloud-native, MLOps, CI/CD avanzado.' },
  { icon: '📚', title: 'Mentoría', desc: 'Compartir conocimiento y elevar equipos.' },
];

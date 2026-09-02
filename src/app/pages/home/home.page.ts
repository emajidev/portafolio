import { Component } from '@angular/core';
import { HeroComponent } from '../../features/hero/hero.component';
import { StatsComponent } from '../../features/stats/stats.component';
import { AboutComponent } from '../../features/about/about.component';
import { SkillsComponent } from '../../features/skills/skills.component';
import { ProjectsComponent } from '../../features/projects/projects.component';
import { AiLabComponent } from '../../features/ai-lab/ai-lab.component';
import { ArcadeComponent } from '../../features/arcade/arcade.component';
import { CompaniesMarqueeComponent } from '../../features/companies-marquee/companies-marquee.component';
import { ExperienceComponent } from '../../features/experience/experience.component';
import { ContactComponent } from '../../features/contact/contact.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    StatsComponent,
    AboutComponent,
    SkillsComponent,
    ProjectsComponent,
    AiLabComponent,
    ArcadeComponent,
    CompaniesMarqueeComponent,
    ExperienceComponent,
    ContactComponent,
  ],
  template: `
    <app-hero />
    <app-stats />
    <app-about />
    <app-skills />
    <app-projects />
    <app-ai-lab />
    <app-arcade />
    <app-companies-marquee />
    <app-experience />
    <app-contact />
  `,
})
export class HomePage {}

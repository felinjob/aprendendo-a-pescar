import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const glossary = defineCollection({
  loader: file('src/data/glossary.json'),
  schema: z.strictObject({
    id: z.string().regex(/^[a-z0-9-]+$/),
    term: z.string().min(2),
    shortDef: z.string().min(15),
    causalMechanism: z.string().min(25),
  }),
});

const legislation2026 = defineCollection({
  loader: file('src/data/legislation2026.json'),
  schema: z.strictObject({
    id: z.string().regex(/^[a-z0-9-]+$/),
    commonName: z.string().min(2),
    scientificName: z.string().regex(/^[A-Z][a-z]+ [a-z]+$/),
    statusMMA2026: z.enum([
      'CR (Criticamente em Perigo)',
      'EN (Em Perigo)',
      'VU (Vulnerável)',
      'Excluído da Portaria 1.667/2026 (Regime IN SEAP 12/2005)',
    ]),
    legalRegime: z.string().min(15),
    closedSeason: z.string().min(5),
  }),
});

const peLines = defineCollection({
  loader: file('src/data/pe-lines.json'),
  schema: z.strictObject({
    id: z.string().regex(/^pe-[0-9-]+$/),
    pe: z.number().positive(),
    diameterMm: z.number().positive(),
    strength4xLb: z.number().positive(),
  }),
});

const fsrsPrompts = defineCollection({
  loader: file('src/data/fsrs-prompts.json'),
  schema: z.strictObject({
    id: z.string().regex(/^[a-z0-9-]+$/),
    moduleId: z.string().regex(/^[a-z0-9-]+$/),
    category: z.string().min(3),
    question: z.string().min(15),
    answer: z.string().min(10),
    causalExplanation: z.string().min(25),
  }),
});

export const collections = {
  glossary,
  legislation2026,
  peLines,
  fsrsPrompts,
};

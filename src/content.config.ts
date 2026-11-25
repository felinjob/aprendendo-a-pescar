import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const glossary = defineCollection({
  loader: file('src/data/glossary.json'),
  schema: z.object({
    id: z.string(),
    term: z.string(),
    category: z.enum([
      'Oceânica & Cais',
      'Água Doce & Costão',
      'Mecânica & Tralha',
      'Biologia & Lei',
    ]),
    shortDef: z.string(),
    causalMechanism: z.string(),
  }),
});

const legislation2026 = defineCollection({
  loader: file('src/data/legislation2026.json'),
  schema: z.object({
    id: z.string(),
    commonName: z.string(),
    scientificName: z.string().min(3),
    statusMMA2026: z.string(),
    regimeCategory: z.enum(['proibida', 'cota', 'defeso', 'monitorada']),
    legalBasis: z.string(),
    regime2026: z.string(),
    closedSeason: z.string().optional(),
    minMaxSize: z.string().optional(),
    notes: z.string(),
  }),
});

const peLines = defineCollection({
  loader: file('src/data/pe-lines.json'),
  schema: z.object({
    id: z.string(),
    pe: z.number().positive(),
    diameterMm: z.number().positive(),
    strength4xLb: z.number().positive(),
    strength8xLb: z.number().positive(),
    typicalUse: z.string(),
  }),
});

const fsrsPrompts = defineCollection({
  loader: file('src/data/fsrs-prompts.json'),
  schema: z.object({
    id: z.string(),
    module: z.string(),
    type: z.enum(['retrieval', 'visual-occlusion', 'calculation']),
    question: z.string(),
    answer: z.string(),
    mnemonicCue: z.string().optional(),
  }),
});

const species = defineCollection({
  loader: file('src/data/species.json'),
  schema: z.object({
    id: z.string(),
    commonName: z.string(),
    scientificName: z.string(),
    biome: z.enum(['Água Doce', 'Estuário & Costão', 'Oceânico']),
    weightRange: z.string(),
    rodPowerLb: z.tuple([z.number(), z.number()]),
    habitat: z.string(),
    primaryLures: z.string(),
    diagnosticTip: z.string(),
    biologyAndLaw: z.string(),
  }),
});

export const collections = {
  glossary,
  legislation2026,
  peLines,
  fsrsPrompts,
  species,
};

import { z } from "zod";

// Reusable field wrapper with confidence + note
const field = (valueSchema) =>
  z.object({
    value: valueSchema.nullable(),
    confidence: z.enum(["high", "medium", "low"]),
    note: z.string().optional(),
  });

// ── Invoice Schema ────────────────────────────────────────────────────────────
const LineItemSchema = z.object({
  description: z.string().nullable(),
  quantity: z.union([z.number(), z.string()]).nullable(),
  unit_price: z.union([z.number(), z.string()]).nullable(),
  total: z.union([z.number(), z.string()]).nullable(),
});

export const InvoiceSchema = z.object({
  vendor: field(z.string()),
  invoice_number: field(z.string()),
  date: field(z.string()),
  due_date: field(z.string()),
  line_items: field(z.array(LineItemSchema)),
  subtotal: field(z.union([z.number(), z.string()])),
  tax: field(z.union([z.number(), z.string()])),
  total: field(z.union([z.number(), z.string()])),
  currency: field(z.string()),
  payment_terms: field(z.string()),
});

// ── Resume Schema ─────────────────────────────────────────────────────────────
const ExperienceSchema = z.object({
  company: z.string().nullable(),
  role: z.string().nullable(),
  duration: z.string().nullable(),
  description: z.string().nullable(),
});

const EducationSchema = z.object({
  institution: z.string().nullable(),
  degree: z.string().nullable(),
  year: z.string().nullable(),
});

export const ResumeSchema = z.object({
  full_name: field(z.string()),
  email: field(z.string()),
  phone: field(z.string()),
  location: field(z.string()),
  summary: field(z.string()),
  skills: field(z.array(z.string())),
  experience: field(z.array(ExperienceSchema)),
  education: field(z.array(EducationSchema)),
  certifications: field(z.array(z.string())),
  links: field(z.object({ linkedin: z.string().nullable(), github: z.string().nullable() })),
});

// ── Contract Schema ───────────────────────────────────────────────────────────
const PartySchema = z.object({
  name: z.string().nullable(),
  role: z.string().nullable(),
  address: z.string().nullable(),
});

export const ContractSchema = z.object({
  contract_title: field(z.string()),
  parties: field(z.array(PartySchema)),
  effective_date: field(z.string()),
  expiration_date: field(z.string()),
  governing_law: field(z.string()),
  payment_amount: field(z.union([z.number(), z.string()])),
  payment_terms: field(z.string()),
  key_obligations: field(z.array(z.string())),
  termination_clause: field(z.string()),
  confidentiality: field(z.string()),
});

// ── Schema map ────────────────────────────────────────────────────────────────
export const SCHEMAS = {
  invoice: InvoiceSchema,
  resume: ResumeSchema,
  contract: ContractSchema,
};

export const SCHEMA_FIELDS = {
  invoice: Object.keys(InvoiceSchema.shape),
  resume: Object.keys(ResumeSchema.shape),
  contract: Object.keys(ContractSchema.shape),
};

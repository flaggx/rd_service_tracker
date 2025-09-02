const express = require("express");
const prisma = require("../prisma");
const { z } = require("zod");
const { validate } = require("../validation");
const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    next();
}

// Accept any case and normalize to UPPERCASE for enums
const PrioritySchema = z.preprocess(
    (v) => (typeof v === "string" ? v.toUpperCase() : v),
    z.enum(["HIGH", "MEDIUM", "LOW"])
);

const WorkTypeSchema = z.preprocess(
    (v) => (typeof v === "string" ? v.toUpperCase() : v),
    z.enum(["INSTALL", "REMOVAL"])
);

// Query schema for GET / with pagination
const listQuerySchema = z.object({
    query: z.object({
        page: z
            .string()
            .regex(/^\d+$/, "Invalid page")
            .transform(Number)
            .optional(),
        pageSize: z
            .string()
            .regex(/^\d+$/, "Invalid pageSize")
            .transform(Number)
            .optional()
    })
});

// Body schema for POST /
// Required: accountName, city
// Optional: all other fields; pictures is an array of URLs
const createTicketSchema = z.object({
    body: z.object({
        accountName: z.string().min(1, "Account Name is required"),
        city: z.string().min(1, "City is required"),
        contactPerson: z.string().optional(),
        contactInfo: z.string().optional(),
        priority: PrioritySchema.optional(), // DB default "LOW" if not provided
        workType: WorkTypeSchema.optional(),
        lease: z.boolean().optional(),
        underWarranty: z.boolean().optional(),
        machineModelOrType: z.string().optional(),
        issueDescription: z.string().optional(),
        requestingTechName: z.string().optional(),
        pictures: z.array(z.string().url("Invalid picture URL")).optional()
    })
});

// Params + body schema for PUT /:id (partial updates for the new fields)
const updateTicketSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "Invalid id")
    }),
    body: z
        .object({
            accountName: z.string().min(1).optional(),
            city: z.string().min(1).optional(),
            contactPerson: z.string().optional(),
            contactInfo: z.string().optional(),
            priority: PrioritySchema.optional(),
            workType: WorkTypeSchema.optional(),
            lease: z.boolean().optional(),
            underWarranty: z.boolean().optional(),
            machineModelOrType: z.string().optional(),
            issueDescription: z.string().optional(),
            requestingTechName: z.string().optional(),
            // Replace images entirely if provided (full new set)
            pictures: z.array(z.string().url("Invalid picture URL")).optional()
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: "At least one field must be provided to update."
        })
});

router.get("/", requireAuth, validate(listQuerySchema), async (req, res, next) => {
    try {
        const page = req.validated.query.page ?? 1;
        const pageSize = req.validated.query.pageSize ?? 50;
        const take = Math.max(1, Math.min(pageSize, 200)); // cap page size to 200
        const skip = Math.max(0, (page - 1) * take);

        const [rows, total] = await Promise.all([
            prisma.ticket.findMany({
                orderBy: { id: "asc" },
                skip,
                take,
                include: {
                    images: {
                        select: { id: true, url: true, createdAt: true }
                    }
                }
            }),
            prisma.ticket.count()
        ]);

        res.json({
            data: rows,
            pagination: {
                page,
                pageSize: take,
                total,
                totalPages: Math.max(1, Math.ceil(total / take))
            }
        });
    } catch (err) {
        next(err);
    }
});

router.post("/", requireAuth, validate(createTicketSchema), async (req, res, next) => {
    try {
        const {
            accountName,
            city,
            contactPerson,
            contactInfo,
            priority,
            workType,
            lease,
            underWarranty,
            machineModelOrType,
            issueDescription,
            requestingTechName,
            pictures
        } = req.validated.body;

        const created = await prisma.ticket.create({
            data: {
                accountName,
                city,
                contactPerson: contactPerson ?? null,
                contactInfo: contactInfo ?? null,
                priority: priority ?? undefined, // let DB default when not provided
                workType: workType ?? undefined,
                lease: lease ?? false,
                underWarranty: underWarranty ?? false,
                machineModelOrType: machineModelOrType ?? null,
                issueDescription: issueDescription ?? null,
                requestingTechName: requestingTechName ?? null,
                images: pictures && pictures.length > 0
                    ? {
                        create: pictures.map((url) => ({ url }))
                    }
                    : undefined
            },
            include: {
                images: {
                    select: { id: true, url: true, createdAt: true }
                }
            }
        });

        res.json(created);
    } catch (err) {
        next(err);
    }
});

router.put("/:id", requireAuth, validate(updateTicketSchema), async (req, res, next) => {
    try {
        const id = Number(req.validated.params.id);
        const {
            accountName,
            city,
            contactPerson,
            contactInfo,
            priority,
            workType,
            lease,
            underWarranty,
            machineModelOrType,
            issueDescription,
            requestingTechName,
            pictures
        } = req.validated.body;

        const data = {
            ...(accountName !== undefined && { accountName }),
            ...(city !== undefined && { city }),
            ...(contactPerson !== undefined && { contactPerson: contactPerson ?? null }),
            ...(contactInfo !== undefined && { contactInfo: contactInfo ?? null }),
            ...(priority !== undefined && { priority }),
            ...(workType !== undefined && { workType }),
            ...(lease !== undefined && { lease }),
            ...(underWarranty !== undefined && { underWarranty }),
            ...(machineModelOrType !== undefined && { machineModelOrType: machineModelOrType ?? null }),
            ...(issueDescription !== undefined && { issueDescription: issueDescription ?? null }),
            ...(requestingTechName !== undefined && { requestingTechName: requestingTechName ?? null })
        };

        const updateArgs = {
            where: { id },
            data,
            include: { images: { select: { id: true, url: true, createdAt: true } } }
        };

        // Replace images if pictures is provided (treat as full replacement)
        if (pictures !== undefined) {
            updateArgs.data.images = {
                deleteMany: {}, // remove existing
                create: pictures.map((url) => ({ url }))
            };
        }

        const updated = await prisma.ticket.update(updateArgs);
        res.json(updated);
    } catch (err) {
        if (err.code === "P2025") return res.status(404).json({ message: "Not found" });
        next(err);
    }
});

module.exports = router;
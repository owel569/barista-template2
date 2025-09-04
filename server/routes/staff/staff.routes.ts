import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation';
import { getDb } from '../../db';
import { employees, shifts } from '../../../shared/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';

const router = Router();

const ShiftFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  status: z.enum(['draft','published','confirmed','completed','cancelled']).optional()
});

router.get('/employees',
  authenticateUser,
  requireRoles(['admin','manager','staff']),
  asyncHandler(async (_req, res) => {
    const db = getDb();
    const data = await db.select().from(employees).orderBy(desc(employees.createdAt));
    res.json({ success: true, data });
  })
);

router.get('/shifts',
  authenticateUser,
  requireRoles(['admin','manager','staff']),
  validateQuery(ShiftFilterSchema),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { startDate, endDate, employeeId, status } = req.query;

    let query = db.select().from(shifts);
    const conditions = [] as any[];
    if (typeof startDate === 'string') conditions.push(gte(shifts.date, new Date(startDate)));
    if (typeof endDate === 'string') conditions.push(lte(shifts.date, new Date(endDate)));
    if (typeof employeeId === 'number') conditions.push(eq(shifts.employeeId, employeeId));
    if (typeof status === 'string') conditions.push(eq(shifts.status, status as any));
    if (conditions.length > 0) query = (query.where(and(...conditions)) as typeof query);

    const data = await query.orderBy(desc(shifts.createdAt));
    res.json({ success: true, data });
  })
);

const CreateShiftSchema = z.object({
  employeeId: z.number().int().positive(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  position: z.string().min(1),
  status: z.enum(['draft','published','confirmed','completed','cancelled']).default('draft'),
  notes: z.string().optional()
});

router.post('/shifts',
  authenticateUser,
  requireRoles(['admin','manager']),
  validateBody(CreateShiftSchema),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const body = req.body as z.infer<typeof CreateShiftSchema>;
    const [created] = await db.insert(shifts).values({
      employeeId: body.employeeId,
      date: new Date(body.date),
      startTime: body.startTime,
      endTime: body.endTime,
      position: body.position,
      status: body.status,
      notes: body.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    res.status(201).json({ success: true, data: created });
  })
);

const UpdateShiftSchema = CreateShiftSchema.partial();

router.patch('/shifts/:id',
  authenticateUser,
  requireRoles(['admin','manager']),
  validateParams(z.object({ id: z.coerce.number().int().positive() })),
  validateBody(UpdateShiftSchema),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const body = req.body as z.infer<typeof UpdateShiftSchema>;
    const updateValues: any = { ...body, updatedAt: new Date() };
    if (typeof body.date === 'string') updateValues.date = new Date(body.date);
    const [updated] = await db.update(shifts).set(updateValues).where(eq(shifts.id, Number(id))).returning();
    res.json({ success: true, data: updated });
  })
);

router.delete('/shifts/:id',
  authenticateUser,
  requireRoles(['admin','manager']),
  validateParams(z.object({ id: z.coerce.number().int().positive() })),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    await db.delete(shifts).where(eq(shifts.id, Number(id)));
    res.json({ success: true, message: 'Shift supprimé' });
  })
);

export default router;


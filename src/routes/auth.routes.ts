import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { signJwt } from "../utils/jwt.util";
import { validate } from "../middleware/validation.middleware";

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = signJwt({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({ token });
});

export default router;

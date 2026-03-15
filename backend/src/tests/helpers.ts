import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import supertest from 'supertest';
import { Express } from 'express';
import { createApp } from '../config/app';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chess_platform_test',
    },
  },
});

export const app: Express = createApp();
export const request = supertest(app);

export async function clearDatabase() {
  await prisma.blogPostTag.deleteMany();
  await prisma.lessonTag.deleteMany();
  await prisma.lessonDiagram.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedBase() {
  // Ensure roles exist
  for (const name of ['user', 'collaborator', 'admin']) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }
  // Ensure categories exist
  const categories = [
    { name: 'Openings', slug: 'openings' },
    { name: 'Concepts', slug: 'concepts' },
    { name: 'Endgames', slug: 'endgames' },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { name: c.name, slug: c.slug } });
  }
  // Ensure difficulty levels exist
  for (const level of [{ name: 'beginner', sortOrder: 1 }, { name: 'intermediate', sortOrder: 2 }, { name: 'advanced', sortOrder: 3 }]) {
    await prisma.difficultyLevel.upsert({ where: { name: level.name }, update: {}, create: level });
  }
  // Ensure statuses exist
  for (const name of ['draft', 'pending_review', 'published', 'rejected']) {
    await prisma.postStatus.upsert({ where: { name }, update: {}, create: { name } });
  }
}

export async function createTestUser(role: 'user' | 'collaborator' | 'admin', suffix = '') {
  const roleRecord = await prisma.role.findUnique({ where: { name: role } });
  const hash = await bcrypt.hash('password123', 10);
  return prisma.user.create({
    data: {
      email: `${role}${suffix}@test.com`,
      username: `${role}${suffix}`,
      passwordHash: hash,
      roleId: roleRecord!.id,
    },
    include: { role: true },
  });
}

export async function loginUser(email: string, password = 'password123'): Promise<string> {
  const res = await request.post('/api/v1/auth/login').send({ email, password });
  return res.body.data.accessToken;
}

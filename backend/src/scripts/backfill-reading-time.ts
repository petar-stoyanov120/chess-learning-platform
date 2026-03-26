import { PrismaClient } from '@prisma/client';
import { estimateReadingTime } from '../utils/readingTime';

const prisma = new PrismaClient();

async function main() {
  console.log('Backfilling reading time for lessons...');
  const lessons = await prisma.lesson.findMany({ where: { readingTime: null }, select: { id: true, content: true } });
  for (const lesson of lessons) {
    const readingTime = estimateReadingTime(lesson.content);
    await prisma.lesson.update({ where: { id: lesson.id }, data: { readingTime } });
  }
  console.log(`Updated ${lessons.length} lessons.`);

  console.log('Backfilling reading time for blog posts...');
  const posts = await prisma.blogPost.findMany({ where: { readingTime: null }, select: { id: true, content: true } });
  for (const post of posts) {
    const readingTime = estimateReadingTime(post.content);
    await prisma.blogPost.update({ where: { id: post.id }, data: { readingTime } });
  }
  console.log(`Updated ${posts.length} blog posts.`);
  console.log('Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

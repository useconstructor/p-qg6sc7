import { db } from '@/lib/db';

export async function GET() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const { rows } = await db.execute('SELECT * FROM notes ORDER BY updated_at DESC');

  if (rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO notes (title, content) VALUES (?, ?)',
      args: ['Mi Rutina Matutina', '6:00 am - Despertar\n6:30 am - Ejercicio\n7:00 am - Ducha y desayuno\n7:30 am - Revisar correos\n8:00 am - Comenzar trabajo'],
    });
    await db.execute({
      sql: 'INSERT INTO notes (title, content) VALUES (?, ?)',
      args: ['Ideas para el Proyecto Q4', 'Rediseñar dashboard\nMejorar onboarding\nImplementar notificaciones en tiempo real\nOptimizar carga de datos\nAgregar modo oscuro'],
    });
    const { rows: seededRows } = await db.execute('SELECT * FROM notes ORDER BY updated_at DESC');
    return Response.json(seededRows);
  }

  return Response.json(rows);
}

export async function POST(req: Request) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const body = await req.json();
  const title = body.title ?? 'Nueva nota';
  const content = body.content ?? '';

  const result = await db.execute({
    sql: 'INSERT INTO notes (title, content) VALUES (?, ?)',
    args: [title, content],
  });

  const { rows } = await db.execute({
    sql: 'SELECT * FROM notes WHERE id = ?',
    args: [result.lastInsertRowid],
  });

  return Response.json(rows[0]);
}

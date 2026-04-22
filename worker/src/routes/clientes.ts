import { Hono } from 'hono';
import { Env, query } from '../db/client';

const router = new Hono<{ Bindings: Env }>();

// POST - Importar clientes desde backup (DEBE IR ANTES DE /:id)
router.post('/importar/backup', async (c) => {
  try {
    const clientes = await c.req.json();

    if (!Array.isArray(clientes) || clientes.length === 0) {
      return c.json({ error: 'Se requiere un array de clientes' }, 400);
    }

    let insertados = 0;
    let duplicados = 0;
    const batchSize = 10;

    for (let i = 0; i < clientes.length; i += batchSize) {
      const batch = clientes.slice(i, i + batchSize);
      
      for (const cliente of batch) {
        try {
          const { nombre, ci, tipo } = cliente;

          if (!nombre) continue;

          let existe = [];
          if (ci) {
            const result = await query(c.env, `SELECT id FROM clientes WHERE ci = ? AND activo = 1`, [ci]);
            existe = result.rows;
          }

          if (existe.length === 0) {
            await query(c.env, `INSERT INTO clientes (nombre, ci, tipo) VALUES (?, ?, ?)`, [nombre.toUpperCase(), ci || null, tipo || 'otro']);
            insertados++;
          } else {
            duplicados++;
          }
        } catch (error) {
          console.error('Error al insertar cliente:', error);
        }
      }
    }

    return c.json({
      success: true,
      insertados,
      duplicados,
      total: insertados + duplicados
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// GET - Buscar clientes por nombre
router.get('/buscar', async (c) => {
  try {
    const q = c.req.query('q');
    
    if (!q || q.trim().length < 2) {
      return c.json({ error: 'Mínimo 2 caracteres' }, 400);
    }

    const searchTerm = `%${q.toUpperCase()}%`;
    const result = await query(c.env, `SELECT id, nombre, ci, tipo FROM clientes WHERE UPPER(nombre) LIKE ? AND activo = 1 ORDER BY nombre ASC LIMIT 20`, [searchTerm]);

    return c.json(result.rows);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// GET - Obtener todos los clientes
router.get('/', async (c) => {
  try {
    const result = await query(c.env, `SELECT id, nombre, ci, tipo FROM clientes WHERE activo = 1 ORDER BY nombre ASC`);
    return c.json(result.rows);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// GET - Obtener cliente por ID
router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await query(c.env, `SELECT id, nombre, ci, tipo FROM clientes WHERE id = ? AND activo = 1`, [id]);

    if (result.rows.length === 0) {
      return c.json({ error: 'Cliente no encontrado' }, 404);
    }

    return c.json(result.rows[0]);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// POST - Crear nuevo cliente
router.post('/', async (c) => {
  try {
    const { nombre, ci, tipo } = await c.req.json();

    if (!nombre) {
      return c.json({ error: 'Campo requerido: nombre' }, 400);
    }

    await query(c.env, `INSERT INTO clientes (nombre, ci, tipo) VALUES (?, ?, ?)`, [nombre.toUpperCase(), ci || null, tipo || 'otro']);
    const result = await query(c.env, `SELECT id, nombre, ci, tipo FROM clientes WHERE nombre = ? ORDER BY id DESC LIMIT 1`, [nombre.toUpperCase()]);

    return c.json(result.rows[0], 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// PUT - Actualizar cliente
router.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { nombre, ci, tipo } = await c.req.json();

    if (!nombre) {
      return c.json({ error: 'Campo requerido: nombre' }, 400);
    }

    await query(c.env, `UPDATE clientes SET nombre = ?, ci = ?, tipo = ? WHERE id = ?`, [nombre.toUpperCase(), ci || null, tipo || 'otro', id]);
    const result = await query(c.env, `SELECT id, nombre, ci, tipo FROM clientes WHERE id = ?`, [id]);

    if (result.rows.length === 0) {
      return c.json({ error: 'Cliente no encontrado' }, 404);
    }

    return c.json(result.rows[0]);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// DELETE - Eliminar cliente (soft delete)
router.delete('/:id', async (c) => {
  try {\n    const id = c.req.param('id');
    await query(c.env, `UPDATE clientes SET activo = 0 WHERE id = ?`, [id]);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default router;

import { Hono } from 'hono';
import { Database } from '@vlcn.io/crsqlite-wasm';

const router = new Hono();

// POST - Importar clientes desde backup (DEBE IR ANTES DE /:id)
router.post('/importar/backup', async (c) => {
  try {
    const clientes = await c.req.json();

    if (!Array.isArray(clientes) || clientes.length === 0) {
      return c.json({ error: 'Se requiere un array de clientes' }, 400);
    }

    const env = c.env as any;
    const db = new Database(env.DB);

    let insertados = 0;
    let duplicados = 0;

    clientes.forEach((cliente: any) => {
      try {
        const { nombre, ci, tipo } = cliente;

        if (!nombre) {
          return;
        }

        // Verificar si ya existe por CI (si tiene CI)
        let existe = [];
        if (ci) {
          existe = db.exec(
            `SELECT id FROM clientes WHERE ci = ? AND activo = 1`,
            [ci]
          );
        }

        if (existe.length === 0) {
          db.exec(
            `INSERT INTO clientes (nombre, ci, tipo) VALUES (?, ?, ?)`,
            [nombre.toUpperCase(), ci || null, tipo || 'otro']
          );
          insertados++;
        } else {
          duplicados++;
        }
      } catch (error) {
        console.error('Error al insertar cliente:', error);
      }
    });

    db.close();

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

    const env = c.env as any;
    const db = new Database(env.DB);
    const searchTerm = `%${q.toUpperCase()}%`;
    
    const clientes = db.exec(
      `SELECT id, nombre, ci, tipo FROM clientes 
       WHERE UPPER(nombre) LIKE ? AND activo = 1 
       ORDER BY nombre ASC 
       LIMIT 20`,
      [searchTerm]
    );

    db.close();

    return c.json(clientes);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// GET - Obtener todos los clientes
router.get('/', async (c) => {
  try {
    const env = c.env as any;
    const db = new Database(env.DB);
    
    const clientes = db.exec(
      `SELECT id, nombre, ci, tipo FROM clientes 
       WHERE activo = 1 
       ORDER BY nombre ASC`
    );

    db.close();

    return c.json(clientes);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// GET - Obtener cliente por ID
router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env as any;
    const db = new Database(env.DB);
    
    const cliente = db.exec(
      `SELECT id, nombre, ci, tipo FROM clientes WHERE id = ? AND activo = 1`,
      [id]
    );

    db.close();

    if (cliente.length === 0) {
      return c.json({ error: 'Cliente no encontrado' }, 404);
    }

    return c.json(cliente[0]);
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

    const env = c.env as any;
    const db = new Database(env.DB);

    db.exec(
      `INSERT INTO clientes (nombre, ci, tipo) VALUES (?, ?, ?)`,
      [nombre.toUpperCase(), ci || null, tipo || 'otro']
    );

    const result = db.exec(
      `SELECT id, nombre, ci, tipo FROM clientes WHERE nombre = ? ORDER BY id DESC LIMIT 1`,
      [nombre.toUpperCase()]
    );

    db.close();

    return c.json(result[0], 201);
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

    const env = c.env as any;
    const db = new Database(env.DB);

    db.exec(
      `UPDATE clientes SET nombre = ?, ci = ?, tipo = ? WHERE id = ?`,
      [nombre.toUpperCase(), ci || null, tipo || 'otro', id]
    );

    const result = db.exec(
      `SELECT id, nombre, ci, tipo FROM clientes WHERE id = ?`,
      [id]
    );

    db.close();

    if (result.length === 0) {
      return c.json({ error: 'Cliente no encontrado' }, 404);
    }

    return c.json(result[0]);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// DELETE - Eliminar cliente (soft delete)
router.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env as any;
    const db = new Database(env.DB);

    db.exec(
      `UPDATE clientes SET activo = 0 WHERE id = ?`,
      [id]
    );

    db.close();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default router;

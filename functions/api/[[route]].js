// Cloudflare Pages Functions - API de sincronización con base de datos D1
// Este archivo se ejecuta automáticamente como Cloudflare Worker en el edge

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Encabezados CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (path === "/api/health") {
    return new Response(JSON.stringify({ status: "ok", edge: "cloudflare-pages", d1: Boolean(env.DB) }), {
      headers: corsHeaders,
    });
  }

  // Si no está configurada la base de datos D1 aún, responder con fallback seguro
  if (!env.DB) {
    return new Response(
      JSON.stringify({
        warning: "Base de datos D1 no vinculada todavía en Cloudflare. Funcionando en modo local.",
        d1_configured: false,
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  try {
    // GET /api/state - Obtiene todo el estado sincronizado de la app
    if (request.method === "GET" && path === "/api/state") {
      const results = await env.DB.prepare("SELECT key, value_json FROM app_state").all();
      const state = {};
      if (results && results.results) {
        for (const row of results.results) {
          try {
            state[row.key] = JSON.parse(row.value_json);
          } catch (e) {
            state[row.key] = row.value_json;
          }
        }
      }
      return new Response(JSON.stringify({ success: true, data: state }), {
        headers: corsHeaders,
      });
    }

    // POST /api/state - Guarda o actualiza una clave o todo el estado en D1
    if (request.method === "POST" && path === "/api/state") {
      const body = await request.json();

      // Si envía clave y valor { key, value }
      if (body.key && body.value !== undefined) {
        const valStr = typeof body.value === "string" ? body.value : JSON.stringify(body.value);
        await env.DB.prepare(
          `INSERT INTO app_state (key, value_json, updated_at) 
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP`
        ).bind(body.key, valStr).run();

        return new Response(JSON.stringify({ success: true, updatedKey: body.key }), {
          headers: corsHeaders,
        });
      }

      // Si envía lote completo de claves { debts: [...], active: {...}, ... }
      const statements = [];
      for (const [k, v] of Object.entries(body)) {
        const valStr = typeof v === "string" ? v : JSON.stringify(v);
        statements.push(
          env.DB.prepare(
            `INSERT INTO app_state (key, value_json, updated_at) 
             VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP`
          ).bind(k, valStr)
        );
      }

      if (statements.length > 0) {
        await env.DB.batch(statements);
      }

      return new Response(JSON.stringify({ success: true, updatedKeys: Object.keys(body) }), {
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ error: "Ruta no encontrada" }), {
      status: 404,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

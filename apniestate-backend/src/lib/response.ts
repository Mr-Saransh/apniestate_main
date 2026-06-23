export const ok = (data: unknown, message = "Success") =>
  Response.json({ success: true, data, message }, { status: 200 });

export const created = (data: unknown, message = "Created") =>
  Response.json({ success: true, data, message }, { status: 201 });

export const noContent = () => new Response(null, { status: 204 });

export const badRequest = (message: string, details?: unknown) =>
  Response.json(
    { success: false, error: { code: "BAD_REQUEST", message, details } },
    { status: 400 }
  );

export const unauthorized = () =>
  Response.json(
    { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
    { status: 401 }
  );

export const forbidden = (message = "Insufficient permissions") =>
  Response.json(
    { success: false, error: { code: "FORBIDDEN", message } },
    { status: 403 }
  );

export const notFound = (resource = "Resource") =>
  Response.json(
    { success: false, error: { code: "NOT_FOUND", message: `${resource} not found` } },
    { status: 404 }
  );

export const conflict = (message: string) =>
  Response.json(
    { success: false, error: { code: "CONFLICT", message } },
    { status: 409 }
  );

export const serverError = (message = "Internal server error") =>
  Response.json(
    { success: false, error: { code: "SERVER_ERROR", message } },
    { status: 500 }
  );

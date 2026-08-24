---
name: Generated API integer schemas
description: Orval currently emits zod.int() for OpenAPI integer fields while this workspace resolves Zod 3.
---

Use numeric OpenAPI fields for generated contracts unless the workspace's Zod version is upgraded and verified.  
**Why:** Code generation succeeds, but the generated Zod package fails the library typecheck when integer schemas become zod.int().  
**How to apply:** Prefer `type: number` for IDs, counts, and progress values in new OpenAPI contracts, then rerun codegen and the library typecheck.
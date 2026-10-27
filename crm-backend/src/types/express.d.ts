import type { RoleName } from "./role";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: RoleName };
    }
  }
}

export {};
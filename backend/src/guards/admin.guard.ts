import type { Request } from 'express';

const admin = (req: Request): boolean | string => {
  return (
    req.user !== undefined &&
    'role' in req.user &&
    typeof req.user.role === 'string' &&
    req.user.role.toLowerCase() === 'admin'
  );
};

export default admin;

import type { User, Role } from '@prisma/client';
import type { User as UserResource } from '@camp-registration/common/entities';

const userResource = (user: Pick<User, keyof UserResource>): UserResource => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    locale: user.locale,
    role: convertRole(user.role),
    emailVerified: user.emailVerified,
    locked: user.locked,
    lastSeen: user.lastSeen?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
};

const convertRole = (role: Role): UserResource['role'] => {
  switch (role) {
    case Role.ADMIN:
      return 'ADMIN';
    case Role.USER:
      return 'USER';
  }
};

export default userResource;

import { CampManager, Invitation, User } from '@prisma/client';
import type { CampManager as CampManagerResource } from '@camp-registration/common/entities';

interface ManagerWithRelationships extends CampManager {
  user: User | null;
  invitation: Invitation | null;
}

const managerResource = (
  manager: ManagerWithRelationships,
): CampManagerResource => {
  const { user, invitation } = manager;

  const email: string = invitation ? invitation.email : (user?.email ?? '');
  const role = 'manager';

  return {
    id: manager.id,
    name: user ? user.name : null,
    email,
    status: user ? 'accepted' : 'pending',
    role,
    expiresAt: manager.expiresAt?.toISOString() ?? null,
  };
};

export default managerResource;

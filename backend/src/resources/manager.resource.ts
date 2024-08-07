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

  const name: string | null = user ? user.name : null;
  const email: string = invitation ? invitation.email : (user?.email ?? '');
  const status: string = user ? 'accepted' : 'pending';
  const role = 'manager';

  return {
    id: manager.id,
    name,
    email,
    status,
    role,
  };
};

export default managerResource;

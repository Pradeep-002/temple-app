import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

export const memberRestrictedGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  const user = api.currentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // Deny access for MEMBER role; redirect to dashboard
  if (user.role === 'MEMBER') {
    router.navigate(['/dashboard']);
    return false;
  }

  // Allow SANGAM_ADMIN, COLLECTOR, SUPER_ADMIN
  return true;
};

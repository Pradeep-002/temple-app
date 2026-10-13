import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

export const superAdminGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  const user = api.currentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // Explicitly allow only SUPER_ADMIN role
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Unauthorized users redirected to dashboard
  router.navigate(['/dashboard']);
  return false;
};

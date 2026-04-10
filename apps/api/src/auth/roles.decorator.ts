import { SetMetadata } from '@nestjs/common';

export const ROLE_METADATA_KEY = 'printos:roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLE_METADATA_KEY, roles);


export const ADMIN_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/admin';

export function withAdminBasePath(path: string) {
  if (!path.startsWith('/')) {
    return `${ADMIN_BASE_PATH}/${path}`;
  }

  return `${ADMIN_BASE_PATH}${path}`;
}

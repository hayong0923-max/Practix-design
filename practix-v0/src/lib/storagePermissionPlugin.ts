/**
 * Web-only stub: StoragePermission plugin is a Capacitor-only feature.
 * On web, permissions are handled by the browser natively.
 */
export interface StoragePermissionPlugin {
  checkPermission(): Promise<{ granted: boolean }>;
  openSettings(): Promise<void>;
}

const StoragePermission: StoragePermissionPlugin = {
  async checkPermission() {
    return { granted: true };
  },
  async openSettings() {
    // No-op on web
  },
};

export default StoragePermission;

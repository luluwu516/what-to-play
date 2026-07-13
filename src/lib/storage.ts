// Ask the browser to treat our IndexedDB as persistent, so it isn't silently
// evicted under storage pressure (or, on some engines, after inactivity). This
// is the collection's only copy — losing it means losing everything. Safe to
// call on every load; it's a no-op once granted or unsupported.
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (!navigator.storage?.persist) return;
    if (await navigator.storage.persisted()) return;
    await navigator.storage.persist();
  } catch {
    // Unsupported or blocked — nothing we can do; export/import is the backstop.
  }
}

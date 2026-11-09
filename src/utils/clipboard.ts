/** Clipboard writes require a secure context and explicit user action. */
export async function copyText(text: string): Promise<void> {
  if (!navigator.clipboard) throw new Error("Clipboard unavailable");
  await navigator.clipboard.writeText(text);
}

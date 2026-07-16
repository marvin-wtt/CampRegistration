import fs from "node:fs/promises";
import path from "node:path";
import type { Locator } from "@playwright/test";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/**
 * Drops files onto an element via a real `drop` event. Playwright's
 * `setInputFiles` only works with `<input type=file>`; drop zones that listen
 * for `drop`/`DataTransfer` (e.g. the SurveyJS `.sd-file__decorator`) need this
 * instead. Reads the files, rebuilds them as `File`s inside the page and
 * dispatches the drag sequence on `target`.
 *
 * @param target Locator of the drop zone the files are dropped on.
 * @param filePaths Absolute paths of the files to drop.
 */
export async function dropFiles(
  target: Locator,
  filePaths: string[],
): Promise<void> {
  const files = await Promise.all(
    filePaths.map(async (filePath) => ({
      name: path.basename(filePath),
      type: MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "",
      data: (await fs.readFile(filePath)).toString("base64"),
    })),
  );

  await target.waitFor();

  const dataTransfer = await target.page().evaluateHandle((files) => {
    const dataTransfer = new DataTransfer();
    for (const { name, type, data } of files) {
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      dataTransfer.items.add(new File([bytes], name, { type }));
    }
    return dataTransfer;
  }, files);

  await target.dispatchEvent("dragenter", { dataTransfer });
  await target.dispatchEvent("dragover", { dataTransfer });
  await target.dispatchEvent("drop", { dataTransfer });
  await dataTransfer.dispose();
}

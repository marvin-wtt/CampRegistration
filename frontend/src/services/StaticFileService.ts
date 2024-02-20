export function useStaticFileService() {
  async function fetchFile(path: string): Promise<ArrayBuffer> {
    const response = await fetch(`/${path}`);

    return response.arrayBuffer();
  }

  return {
    fetchFile,
  };
}

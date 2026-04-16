import { FileService } from '@/application/types/ports.ts';

export default class FetchFileService implements FileService {
  async loadSharedArrayBuffer(url: string): Promise<SharedArrayBuffer> {
    if (typeof SharedArrayBuffer === 'undefined') {
      throw new Error('SharedArrayBuffer is not available. Ensure COOP/COEP headers are set.');
    }
    const buffer = typeof DecompressionStream !== 'undefined' ? await this.fetchCompressed(url) : await this.fetchRaw(url);
    const shared = new SharedArrayBuffer(buffer.byteLength);
    new Uint8Array(shared).set(new Uint8Array(buffer));
    return shared;
  }

  private async fetchCompressed(url: string): Promise<ArrayBuffer> {
    const response = await fetch(`${url}.gz`);
    if (!response.ok || !response.body) return this.fetchRaw(url);
    const decompressed = response.body.pipeThrough(new DecompressionStream('gzip'));
    return new Response(decompressed).arrayBuffer();
  }

  private async fetchRaw(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    return response.arrayBuffer();
  }
}

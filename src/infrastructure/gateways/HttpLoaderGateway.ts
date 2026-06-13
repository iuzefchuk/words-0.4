import type { LoaderGateway } from '@/application/types/gateways.ts';

export default class HttpLoaderGateway {
  static async load(url: string): Promise<ArrayBufferLike> {
    const gzUrl = `${url}.gz`;
    const response = await fetch(gzUrl);
    if (!response.ok) throw new Error(`failed to fetch ${gzUrl}: ${String(response.status)} ${response.statusText}`);
    const compressed = await response.arrayBuffer();
    if (typeof SharedArrayBuffer === 'undefined') return HttpLoaderGateway.decompress(compressed);
    return HttpLoaderGateway.decompressIntoSAB(compressed);
  }

  private static async decompress(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 2 || bytes[0] !== 0x1f || bytes[1] !== 0x8b) return buffer;
    const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).arrayBuffer();
  }

  private static async decompressIntoSAB(compressed: ArrayBuffer): Promise<SharedArrayBuffer> {
    const bytes = new Uint8Array(compressed);
    if (bytes.length < 2 || bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
      const sab = new SharedArrayBuffer(compressed.byteLength);
      new Uint8Array(sab).set(bytes);
      return sab;
    }
    const view = new DataView(compressed);
    const uncompressedSize = view.getUint32(compressed.byteLength - 4, true);
    const sab = new SharedArrayBuffer(uncompressedSize);
    const target = new Uint8Array(sab);
    let offset = 0;
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
    const reader = stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      target.set(value, offset);
      offset += value.byteLength;
    }
    return sab;
  }
}

HttpLoaderGateway satisfies LoaderGateway;

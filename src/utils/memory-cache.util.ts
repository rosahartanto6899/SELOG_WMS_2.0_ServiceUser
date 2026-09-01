import NodeCache from 'node-cache';
import { ICache } from '@/shared-libs/interfaces/cache.interface';

// ponytail: cache in-memory (node-cache) supaya jalan tanpa Redis —
// data hilang saat restart & tidak shared antar instance.
// Kembalikan import '@/shared-libs/utils/cache.util' di pemanggil saat Redis aktif lagi.
class MemoryCache implements ICache {
  private store = new NodeCache({ stdTTL: 3600 });

  async get<T>(key: string): Promise<T | null> {
    return this.store.get<T>(key) ?? null;
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    this.store.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    this.store.del(key);
  }

  async deleteKeysByPattern(pattern: string): Promise<void> {
    this.store.del(await this.keys(pattern));
  }

  async keys(pattern: string): Promise<string[]> {
    const re = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    return this.store.keys().filter((k) => re.test(k));
  }
}

export default new MemoryCache();

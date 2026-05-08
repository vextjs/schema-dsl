import { CacheManager } from '../../dist/index.js';

const cache = new CacheManager({
  maxSize: 2,
  ttl: 60_000,
  statsEnabled: true
});

cache.set('user', { compiled: 'user' });
cache.set('post', { compiled: 'post' });
cache.get('user');
cache.set('order', { compiled: 'order' });

console.log('cache-manager.user.hit =', cache.get('user') !== null);
console.log('cache-manager.post.evicted =', cache.get('post') === null);
console.log('cache-manager.order.exists =', cache.has('order'));

const stats = cache.getStats();
console.log('cache-manager.stats.size =', stats.size);
console.log('cache-manager.stats.hitRate =', stats.hitRate);

cache.resetStats();
console.log('cache-manager.reset.hits =', cache.getStats().hits);
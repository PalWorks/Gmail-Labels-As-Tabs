import { STORE_URL } from '../content/site';

/** The store link, tagged so the store's own analytics can tell where installs came from. */
export function storeLink(placement: string): string {
  return `${STORE_URL}?utm_source=website&utm_medium=${encodeURIComponent(placement)}`;
}

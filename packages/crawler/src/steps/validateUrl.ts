import dns from 'node:dns';
import net from 'node:net';
import type { ValidateUrlResult } from '../types';

/**
 * Evaluates whether an IP address belongs to a private, loopback, link-local, or reserved range.
 * Used for strict Server-Side Request Forgery (SSRF) mitigation.
 */
export function isPrivateIp(ip: string): boolean {
  if (!net.isIP(ip)) return true;

  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }
    const [p0, p1, p2] = parts as [number, number, number, number];

    // 0.0.0.0/8
    if (p0 === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (p0 === 127) return true;
    // 10.0.0.0/8 (RFC1918 Private)
    if (p0 === 10) return true;
    // 172.16.0.0/12 (RFC1918 Private)
    if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
    // 192.168.0.0/16 (RFC1918 Private)
    if (p0 === 192 && p1 === 168) return true;
    // 169.254.0.0/16 (Link-Local)
    if (p0 === 169 && p1 === 254) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;
    // 192.0.2.0/24 (TEST-NET-1)
    if (p0 === 192 && p1 === 0 && p2 === 2) return true;
    // 198.51.100.0/24 (TEST-NET-2)
    if (p0 === 198 && p1 === 51 && p2 === 100) return true;
    // 203.0.113.0/24 (TEST-NET-3)
    if (p0 === 203 && p1 === 0 && p2 === 113) return true;
    // 240.0.0.0/4 (Reserved)
    if (p0 >= 240) return true;

    return false;
  }

  // IPv6 checks
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  // fe80::/10 (Link-local)
  if (
    lower.startsWith('fe8') ||
    lower.startsWith('fe9') ||
    lower.startsWith('fea') ||
    lower.startsWith('feb')
  ) {
    return true;
  }
  // fc00::/7 (Unique Local Address)
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (lower.includes('::ffff:')) {
    const v4Part = lower.split('::ffff:')[1];
    if (v4Part && net.isIPv4(v4Part)) {
      return isPrivateIp(v4Part);
    }
  }

  return false;
}

/**
 * Validates a target URL scheme and pre-resolves DNS to enforce SSRF IP restrictions.
 */
export async function validateUrl(urlStr: string): Promise<ValidateUrlResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlStr);
  } catch {
    return { valid: false, url: urlStr, error: 'Invalid URL format.' };
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return {
      valid: false,
      url: urlStr,
      error: `Disallowed URL protocol '${parsedUrl.protocol}'. Only HTTP and HTTPS are permitted.`,
    };
  }

  const hostLower = parsedUrl.hostname.toLowerCase();
  if (
    hostLower === 'localhost' ||
    hostLower.endsWith('.localhost') ||
    hostLower.endsWith('.local')
  ) {
    return {
      valid: false,
      url: urlStr,
      error: `SSRF Protection: Hostname '${parsedUrl.hostname}' is prohibited.`,
    };
  }

  if (net.isIP(parsedUrl.hostname) && isPrivateIp(parsedUrl.hostname)) {
    return {
      valid: false,
      url: urlStr,
      resolvedIp: parsedUrl.hostname,
      error: `SSRF Protection: IP ${parsedUrl.hostname} is in a private, loopback, or reserved range.`,
    };
  }

  try {
    const addresses = await dns.promises.lookup(parsedUrl.hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return {
        valid: false,
        url: urlStr,
        error: `DNS lookup failed for host ${parsedUrl.hostname}`,
      };
    }

    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        return {
          valid: false,
          url: urlStr,
          resolvedIp: record.address,
          error: `SSRF Protection: Resolved IP ${record.address} is in a private, loopback, or reserved range.`,
        };
      }
    }

    return {
      valid: true,
      url: parsedUrl.toString(),
      resolvedIp: addresses[0]?.address,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'DNS lookup error';
    return { valid: false, url: urlStr, error: `DNS resolution failed: ${msg}` };
  }
}

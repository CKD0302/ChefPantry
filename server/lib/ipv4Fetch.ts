import { fetch as undiciFetch, RequestInit, RequestInfo, Agent } from 'undici';

const agent = new Agent({ connect: { family: 4 } });

export async function ipv4Fetch(input: RequestInfo, init?: RequestInit) {
  return undiciFetch(input as any, { ...init, dispatcher: agent } as any);
}
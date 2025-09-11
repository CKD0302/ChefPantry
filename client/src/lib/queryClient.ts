import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/utils/supabaseClient";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get the current session for authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  
  // Debug logging for POST requests
  if (method === "POST") {
    console.log(`DEBUG apiRequest ${method} ${url}`);
    console.log("Session exists:", !!session);
    console.log("Token exists:", !!session?.access_token);
    console.log("Headers being sent:", headers);
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (method === "POST") {
    console.log("Response status:", res.status);
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {};
    
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

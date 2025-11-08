import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineCollection } from '../defineCollection';
import { configureSymulate, getConfig } from '../config';
import { m } from '../schema';

describe('Custom Fetch', () => {
  const originalConfig = getConfig();

  beforeEach(() => {
    // Reset to production mode for these tests
    configureSymulate({
      environment: 'production',
      backendBaseUrl: 'http://localhost:3000',
    });
  });

  afterEach(() => {
    // Restore original config
    configureSymulate(originalConfig);
    vi.restoreAllMocks();
  });

  it('should use global custom fetch when configured', async () => {
    const customFetchSpy = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      return new Response(JSON.stringify({ id: '1', name: 'Test User' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    configureSymulate({
      environment: 'production',
      backendBaseUrl: 'http://localhost:3000',
      fetch: customFetchSpy,
    });

    const users = defineCollection({
      name: 'users',
      schema: m.object({
        id: m.string(),
        name: m.string(),
      }),
    });

    const result = await users.get('1');

    expect(customFetchSpy).toHaveBeenCalledTimes(1);
    expect(customFetchSpy.mock.calls[0][0]).toBe('http://localhost:3000/users/1');
    expect(result).toEqual({ id: '1', name: 'Test User' });
  });

  it('should use per-operation custom fetch over global fetch', async () => {
    const globalFetchSpy = vi.fn(async () => {
      return new Response(JSON.stringify({ id: '1', name: 'Global' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const operationFetchSpy = vi.fn(async () => {
      return new Response(JSON.stringify({ id: '1', name: 'Operation' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    configureSymulate({
      environment: 'production',
      backendBaseUrl: 'http://localhost:3000',
      fetch: globalFetchSpy,
    });

    const users = defineCollection({
      name: 'users',
      schema: m.object({
        id: m.string(),
        name: m.string(),
      }),
    });

    const result = await users.get('1', { fetch: operationFetchSpy });

    // Should call operation fetch, not global
    expect(operationFetchSpy).toHaveBeenCalledTimes(1);
    expect(globalFetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ id: '1', name: 'Operation' });
  });

  it('should add custom headers with custom fetch', async () => {
    const customFetchSpy = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      // Verify custom header was added
      const headers = new Headers(init?.headers);
      expect(headers.get('Authorization')).toBe('Bearer test-token');

      return new Response(JSON.stringify({ id: '1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const authFetch = async (input: RequestInfo, init?: RequestInit) => {
      return customFetchSpy(input, {
        ...init,
        headers: {
          ...init?.headers,
          'Authorization': 'Bearer test-token',
        },
      });
    };

    const users = defineCollection({
      name: 'users',
      schema: m.object({
        id: m.string(),
      }),
    });

    await users.get('1', { fetch: authFetch });

    expect(customFetchSpy).toHaveBeenCalled();
  });

  it('should work with list operation using custom fetch', async () => {
    const customFetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: [{ id: '1', name: 'User 1' }],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    const users = defineCollection({
      name: 'users',
      schema: m.object({
        id: m.string(),
        name: m.string(),
      }),
    });

    const result = await users.list({ page: 1, fetch: customFetchSpy });

    expect(customFetchSpy).toHaveBeenCalledTimes(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({ id: '1', name: 'User 1' });
  });

  it('should work with create operation using custom fetch', async () => {
    const customFetchSpy = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      return new Response(
        JSON.stringify({ id: '1', ...body }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    const users = defineCollection({
      name: 'users',
      schema: m.object({
        id: m.string(),
        name: m.string(),
      }),
    });

    const result = await users.create(
      { name: 'New User' },
      { fetch: customFetchSpy }
    );

    expect(customFetchSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: '1', name: 'New User' });
  });

  it('should work with update operation using custom fetch', async () => {
    const customFetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({ id: '1', name: 'Updated User' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    const users = defineCollection({
      name: 'users',
      schema: m.object({
        id: m.string(),
        name: m.string(),
      }),
    });

    const result = await users.update(
      '1',
      { name: 'Updated User' },
      { fetch: customFetchSpy }
    );

    expect(customFetchSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: '1', name: 'Updated User' });
  });

  it('should work with replace operation using custom fetch', async () => {
    const customFetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({ id: '1', name: 'Replaced User' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    const users = defineCollection({
      name: 'users',
      schema: m.object({
        id: m.string(),
        name: m.string(),
      }),
    });

    const result = await users.replace(
      '1',
      { name: 'Replaced User' },
      { fetch: customFetchSpy }
    );

    expect(customFetchSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: '1', name: 'Replaced User' });
  });

  it('should work with delete operation using custom fetch', async () => {
    const customFetchSpy = vi.fn(async () => {
      return new Response(null, { status: 204 });
    });

    const users = defineCollection({
      name: 'users',
      schema: m.object({
        id: m.string(),
        name: m.string(),
      }),
    });

    await users.delete('1', { fetch: customFetchSpy });

    expect(customFetchSpy).toHaveBeenCalledTimes(1);
  });
});

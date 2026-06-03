import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

const { supabase } = require('../../lib/supabase');

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  it('exposes loading=true initially, then false once getSession resolves', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.session).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('restores session and exposes accessToken', async () => {
    const session = { access_token: 'tok-123', user: { id: 'u1' } };
    supabase.auth.getSession.mockResolvedValue({ data: { session } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toEqual(session);
    expect(result.current.user).toEqual({ id: 'u1' });
    expect(result.current.accessToken).toBe('tok-123');
  });

  it('signUp passes signup_source: "mobile" in options.data', async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signUp({
        email: 'a@b.com',
        password: 'pw',
        firstName: 'A',
        lastName: 'B',
      });
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pw',
      options: {
        data: {
          first_name: 'A',
          last_name: 'B',
          display_name: 'A',
          signup_source: 'mobile',
        },
      },
    });
  });

  it('signIn calls signInWithPassword with the credentials', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signIn({ email: 'a@b.com', password: 'pw' });
    });
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pw',
    });
  });

  it('signOut calls supabase.auth.signOut', async () => {
    supabase.auth.signOut.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('useAuth throws when used outside an AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    consoleError.mockRestore();
  });
});

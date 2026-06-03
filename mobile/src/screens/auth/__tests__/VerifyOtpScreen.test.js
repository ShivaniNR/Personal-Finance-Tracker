import { render, fireEvent, screen, waitFor, act } from '@testing-library/react-native';
import VerifyOtpScreen from '../VerifyOtpScreen';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      verifyOtp: jest.fn(),
      resend: jest.fn(),
    },
  },
}));

const { supabase } = require('../../../lib/supabase');

describe('VerifyOtpScreen', () => {
  let navigation;
  let route;

  beforeEach(() => {
    jest.clearAllMocks();
    navigation = { navigate: jest.fn() };
    route = { params: { email: 'alice@example.com' } };
  });

  it('shows the email in the subtitle', () => {
    render(<VerifyOtpScreen navigation={navigation} route={route} />);
    expect(screen.getByText(/alice@example\.com/)).toBeTruthy();
  });

  it('filters non-numeric characters from input', () => {
    render(<VerifyOtpScreen navigation={navigation} route={route} />);
    const input = screen.getByPlaceholderText('123456');
    fireEvent.changeText(input, 'abc123');
    expect(input.props.value).toBe('123');
  });

  it('caps input at 6 digits', () => {
    render(<VerifyOtpScreen navigation={navigation} route={route} />);
    const input = screen.getByPlaceholderText('123456');
    fireEvent.changeText(input, '1234567890');
    expect(input.props.value).toBe('123456');
  });

  it('shows inline error when Verify is tapped with fewer than 6 digits', () => {
    render(<VerifyOtpScreen navigation={navigation} route={route} />);
    fireEvent.changeText(screen.getByPlaceholderText('123456'), '123');
    fireEvent.press(screen.getByText('Verify'));
    expect(screen.getByText('Enter the 6-digit code from your email.')).toBeTruthy();
    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it('calls verifyOtp with email, token, and type "signup" on valid submit', async () => {
    supabase.auth.verifyOtp.mockResolvedValue({ data: { session: {} }, error: null });
    render(<VerifyOtpScreen navigation={navigation} route={route} />);
    fireEvent.changeText(screen.getByPlaceholderText('123456'), '123456');
    fireEvent.press(screen.getByText('Verify'));

    await waitFor(() => expect(supabase.auth.verifyOtp).toHaveBeenCalled());
    expect(supabase.auth.verifyOtp.mock.calls[0][0]).toEqual({
      email: 'alice@example.com',
      token: '123456',
      type: 'signup',
    });
  });

  it('displays the error message from verifyOtp inline', async () => {
    supabase.auth.verifyOtp.mockResolvedValue({
      error: { message: 'Token has expired or is invalid' },
    });
    render(<VerifyOtpScreen navigation={navigation} route={route} />);
    fireEvent.changeText(screen.getByPlaceholderText('123456'), '123456');
    fireEvent.press(screen.getByText('Verify'));

    await waitFor(() =>
      expect(screen.getByText('Token has expired or is invalid')).toBeTruthy()
    );
  });

  it('clears the error when user starts typing again', async () => {
    supabase.auth.verifyOtp.mockResolvedValue({
      error: { message: 'Token has expired or is invalid' },
    });
    render(<VerifyOtpScreen navigation={navigation} route={route} />);
    fireEvent.changeText(screen.getByPlaceholderText('123456'), '123456');
    fireEvent.press(screen.getByText('Verify'));
    await waitFor(() =>
      expect(screen.getByText('Token has expired or is invalid')).toBeTruthy()
    );

    fireEvent.changeText(screen.getByPlaceholderText('123456'), '123457');
    expect(screen.queryByText('Token has expired or is invalid')).toBeNull();
  });

  it('calls supabase.auth.resend with the right payload and starts cooldown', async () => {
    supabase.auth.resend.mockResolvedValue({ error: null });
    render(<VerifyOtpScreen navigation={navigation} route={route} />);
    fireEvent.press(screen.getByText("Didn't get it? Resend code"));

    await waitFor(() => expect(supabase.auth.resend).toHaveBeenCalled());
    expect(supabase.auth.resend.mock.calls[0][0]).toEqual({
      type: 'signup',
      email: 'alice@example.com',
    });

    // Cooldown is now active
    await waitFor(() => expect(screen.getByText(/Resend code in/)).toBeTruthy());
  });

  it('does not call resend again while cooldown is active', async () => {
    supabase.auth.resend.mockResolvedValue({ error: null });
    render(<VerifyOtpScreen navigation={navigation} route={route} />);
    fireEvent.press(screen.getByText("Didn't get it? Resend code"));
    await waitFor(() => expect(supabase.auth.resend).toHaveBeenCalledTimes(1));

    // The label has changed to "Resend code in Ns" — tapping it should not fire resend again
    await waitFor(() => expect(screen.getByText(/Resend code in/)).toBeTruthy());
    fireEvent.press(screen.getByText(/Resend code in/));
    expect(supabase.auth.resend).toHaveBeenCalledTimes(1);
  });

  it('navigates back to SignUp when "Sign up again" link is tapped', () => {
    render(<VerifyOtpScreen navigation={navigation} route={route} />);
    fireEvent.press(screen.getByText('Sign up again'));
    expect(navigation.navigate).toHaveBeenCalledWith('SignUp');
  });
});

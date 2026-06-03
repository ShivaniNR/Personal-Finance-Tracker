import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignUpScreen from '../SignUpScreen';
import { useAuth } from '../../../context/AuthContext';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('SignUpScreen', () => {
  let signUp;
  let navigation;

  beforeEach(() => {
    jest.clearAllMocks();
    signUp = jest.fn();
    navigation = { navigate: jest.fn() };
    useAuth.mockReturnValue({ signUp });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('alerts and blocks signUp if required fields are empty', () => {
    render(<SignUpScreen navigation={navigation} />);
    fireEvent.press(screen.getByText('Sign Up'));
    expect(Alert.alert).toHaveBeenCalledWith('Missing info', expect.any(String));
    expect(signUp).not.toHaveBeenCalled();
  });

  it('calls signUp with trimmed email and the form fields', async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null });
    render(<SignUpScreen navigation={navigation} />);
    fireEvent.changeText(screen.getByPlaceholderText('First name'), 'Alice');
    fireEvent.changeText(screen.getByPlaceholderText('Last name'), 'Smith');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), '  alice@example.com  ');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'secret123');
    fireEvent.press(screen.getByText('Sign Up'));

    await waitFor(() => expect(signUp).toHaveBeenCalled());
    expect(signUp.mock.calls[0][0]).toEqual({
      email: 'alice@example.com',
      password: 'secret123',
      firstName: 'Alice',
      lastName: 'Smith',
    });
  });

  it('navigates to VerifyOtp with the trimmed email on successful signup without session', async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null });
    render(<SignUpScreen navigation={navigation} />);
    fireEvent.changeText(screen.getByPlaceholderText('First name'), 'Alice');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), '  alice@example.com  ');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'secret123');
    fireEvent.press(screen.getByText('Sign Up'));

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('VerifyOtp', {
        email: 'alice@example.com',
      })
    );
  });

  it('does NOT navigate when signUp returns a session (email confirmation off)', async () => {
    signUp.mockResolvedValue({
      data: { session: { access_token: 't' } },
      error: null,
    });
    render(<SignUpScreen navigation={navigation} />);
    fireEvent.changeText(screen.getByPlaceholderText('First name'), 'Alice');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'alice@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'secret123');
    fireEvent.press(screen.getByText('Sign Up'));

    await waitFor(() => expect(signUp).toHaveBeenCalled());
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('shows an Alert with the error message if signUp fails', async () => {
    signUp.mockResolvedValue({
      data: null,
      error: { message: 'Email already registered' },
    });
    render(<SignUpScreen navigation={navigation} />);
    fireEvent.changeText(screen.getByPlaceholderText('First name'), 'Alice');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'alice@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'secret123');
    fireEvent.press(screen.getByText('Sign Up'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Sign up failed', 'Email already registered')
    );
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('navigates to Login when the "Sign in" link is tapped', () => {
    render(<SignUpScreen navigation={navigation} />);
    fireEvent.press(screen.getByText('Sign in'));
    expect(navigation.navigate).toHaveBeenCalledWith('Login');
  });
});

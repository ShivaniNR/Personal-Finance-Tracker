import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../LoginScreen';
import { useAuth } from '../../../context/AuthContext';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('LoginScreen', () => {
  let signIn;
  let navigation;

  beforeEach(() => {
    jest.clearAllMocks();
    signIn = jest.fn();
    navigation = { navigate: jest.fn() };
    useAuth.mockReturnValue({ signIn });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('alerts and blocks signIn when email or password is missing', () => {
    render(<LoginScreen navigation={navigation} />);
    fireEvent.press(screen.getByText('Sign In'));
    expect(Alert.alert).toHaveBeenCalledWith('Missing info', expect.any(String));
    expect(signIn).not.toHaveBeenCalled();
  });

  it('calls signIn with the trimmed email and the password', async () => {
    signIn.mockResolvedValue({ error: null });
    render(<LoginScreen navigation={navigation} />);
    fireEvent.changeText(screen.getByPlaceholderText('Email'), '  alice@example.com  ');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'secret');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(signIn.mock.calls[0][0]).toEqual({
      email: 'alice@example.com',
      password: 'secret',
    });
  });

  it('shows an Alert with the error message when signIn fails', async () => {
    signIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    render(<LoginScreen navigation={navigation} />);
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'alice@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'wrong');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Sign in failed', 'Invalid login credentials')
    );
  });

  it('navigates to SignUp when the "Sign up" link is tapped', () => {
    render(<LoginScreen navigation={navigation} />);
    fireEvent.press(screen.getByText('Sign up'));
    expect(navigation.navigate).toHaveBeenCalledWith('SignUp');
  });
});

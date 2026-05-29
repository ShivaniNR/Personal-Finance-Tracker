import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import MainTabs from './MainTabs';
import AuthNavigator from './AuthNavigator';

// Gate: while restoring the session show a spinner, then route to the app or auth.
export default function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return session ? <MainTabs /> : <AuthNavigator />;
}

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import TransactionFormScreen from '../screens/TransactionFormScreen';

const Stack = createNativeStackNavigator();

// Wraps the tabs so the add/edit form can be presented as a modal over them.
export default function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="TransactionForm"
        component={TransactionFormScreen}
        options={({ route }) => ({
          presentation: 'modal',
          title: route.params?.transaction ? 'Edit Transaction' : 'Add Transaction',
        })}
      />
    </Stack.Navigator>
  );
}

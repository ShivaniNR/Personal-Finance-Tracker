import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import TransactionFormScreen from '../screens/TransactionFormScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BudgetSettingScreen from '../screens/BudgetSettingScreen';
import ImportCSVScreen from '../screens/ImportCSVScreen';

const Stack = createNativeStackNavigator();

// Wraps the tabs so transactional flows (form, profile, budget, CSV import)
// can be presented over them.
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
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="BudgetSetting"
        component={BudgetSettingScreen}
        options={{ title: 'Monthly Budget' }}
      />
      <Stack.Screen
        name="ImportCSV"
        component={ImportCSVScreen}
        options={{ title: 'Import CSV' }}
      />
    </Stack.Navigator>
  );
}

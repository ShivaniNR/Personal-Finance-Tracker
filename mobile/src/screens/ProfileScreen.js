import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

function Row({ icon, label, hint, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
        <MaterialIcons name={icon} size={22} color={danger ? '#dc2626' : '#2563eb'} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={22} color="#9ca3af" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {/* User card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={36} color="#fff" />
        </View>
        <View style={styles.userText}>
          <Text style={styles.userName}>
            {user?.user_metadata?.display_name || user?.user_metadata?.first_name || 'You'}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email || ''}
          </Text>
        </View>
      </View>

      {/* Sections */}
      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.section}>
        <Row
          icon="upload-file"
          label="Import CSV"
          hint="Bring transactions in from a bank export"
          onPress={() => navigation.navigate('ImportCSV')}
        />
        <View style={styles.divider} />
        <Row
          icon="account-balance-wallet"
          label="Budget setting"
          hint="Set your monthly spending limit"
          onPress={() => navigation.navigate('BudgetSetting')}
        />
      </View>

      <View style={[styles.section, styles.sectionMt]}>
        <Row icon="logout" label="Sign out" onPress={signOut} danger />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userText: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  userEmail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  sectionLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  sectionMt: { marginTop: 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: { backgroundColor: '#fef2f2' },
  rowText: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: '#111827' },
  labelDanger: { color: '#dc2626' },
  hint: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 60 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { apiRequest } from '../../services/api.service';

export const CollectorDashboardScreen = ({ onSelectMember }: { onSelectMember: (member: any) => void }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    const res = await apiRequest('/members');
    setLoading(false);
    if (res.success) {
      setMembers(res.data);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Collection Agent Dashboard</Text>
      <Text style={styles.subTitle}>Select assigned member to collect monthly contribution</Text>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadMembers}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.memberCard} onPress={() => onSelectMember(item)}>
            <View>
              <Text style={styles.memberCode}>{item.memberCode}</Text>
              <Text style={styles.memberName}>{item.name}</Text>
              <Text style={styles.mobile}>{item.mobileNumber}</Text>
            </View>
            <View style={styles.collectBadge}>
              <Text style={styles.collectText}>Collect ₹</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0B3C2D' },
  subTitle: { fontSize: 12, color: '#64748B', marginBottom: 16 },
  memberCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#0B3C2D', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  memberCode: { fontSize: 11, fontWeight: 'bold', color: '#0B3C2D' },
  memberName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginTop: 2 },
  mobile: { fontSize: 12, color: '#64748B', marginTop: 2 },
  collectBadge: { backgroundColor: '#D4AF37', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  collectText: { color: '#0F172A', fontWeight: 'bold', fontSize: 14 }
});

import { Link, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import Styles from '../lib/styles';

export default function NotFoundScreen() {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Page Not Found</Text>
      <Text style={{ marginBottom: 20, textAlign: 'center' }}>
        The page you are looking for at <Text style={{ fontWeight: 'bold' }}>{pathname}</Text> does not exist.
      </Text>
      <Link href="/" asChild>
        <TouchableOpacity style={Styles.primaryButton}>
          <Text style={Styles.primaryButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';
import { hapticLight } from '../utils/haptics';

interface GameCardProps {
  title: string;
  subtitle?: string;
  gradient: [string, string];
  onPress: () => void;
  size?: 'normal' | 'large';
}

export default function GameCard({ title, subtitle, gradient, onPress, size = 'normal' }: GameCardProps) {
  const handlePress = () => {
    hapticLight();
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[styles.container, size === 'large' && styles.containerLarge]}
    >
      <View style={styles.iconWrap}>
        <Zap size={size === 'large' ? 24 : 20} color={Colors.accent} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    padding: Spacing.lg,
    justifyContent: 'space-between',
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  containerLarge: {
    width: '100%',
    aspectRatio: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent + '18',
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    gap: 2,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.secondary,
  },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, ms, space, type } from '../theme';
import { Button } from './Button';
import { IconCircle } from './Card';

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.wrap}>
      <IconCircle icon={icon} size={ms(72)} />
      <Text style={styles.title}>{title}</Text>
      {!!body && <Text style={styles.body}>{body}</Text>}
      {action && <Button label={action.label} onPress={action.onPress} block={false} style={styles.action} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.lg, gap: space.sm },
  title: { ...type.h3, color: colors.black, textAlign: 'center', marginTop: space.sm },
  body: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  action: { alignSelf: 'center', marginTop: space.md },
});

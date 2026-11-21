import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, ms, radius, shadow } from '../theme';

export type TabItem<K extends string> = { key: K; label: string; badge?: string };

/** Segmented control: grey track, active segment is a white floating pill. */
export function SegmentedTabs<K extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t.badge ? `${t.label}, ${t.badge}` : t.label}
            onPress={() => {
              if (active) return;
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              onChange(t.key);
            }}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {t.label}
            </Text>
            {!!t.badge && (
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{t.badge}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: ms(4) },
  tab: {
    flex: 1,
    height: ms(44),
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
  },
  tabActive: { backgroundColor: colors.surface, ...shadow.card },
  label: { fontFamily: font.semibold, fontSize: ms(15), color: colors.textMuted },
  labelActive: { color: colors.black },
  badge: { minWidth: ms(24), paddingHorizontal: ms(7), height: ms(22), borderRadius: radius.pill, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  badgeActive: { backgroundColor: colors.primarySoft },
  badgeText: { fontFamily: font.bold, fontSize: ms(12), color: colors.textMuted, fontVariant: ['tabular-nums'] },
  badgeTextActive: { color: colors.primary },
});

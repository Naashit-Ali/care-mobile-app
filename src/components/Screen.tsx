import { useHeaderHeight } from 'expo-router/react-navigation';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, ms, shadow, sizes, space } from '../theme';
import { Loader } from './Loader';

export function Screen({
  children,
  refreshing,
  onRefresh,
  noHeader,
  header,
  footer,
  background = colors.surface,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Screen without a navigation header: also pad below the status bar. */
  noHeader?: boolean;
  /** Pinned above the scrolling content (e.g. tabs). */
  header?: ReactNode;
  /** Pinned bottom action bar (thumb zone), stays above the keyboard. */
  footer?: ReactNode;
  background?: string;
}) {
  const headerHeight = useHeaderHeight();
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: background }]}
      edges={noHeader ? ['top', 'bottom', 'left', 'right'] : ['bottom', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={noHeader ? 0 : headerHeight}
      >
        {header && <View style={styles.header}>{header}</View>}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Full-screen loading state while a screen fetches its first data. */
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <Loader label={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: sizes.screenPadding, paddingTop: space.sm, paddingBottom: space.md },
  content: { padding: sizes.screenPadding, gap: space.md, paddingBottom: ms(40) },
  footer: {
    paddingHorizontal: sizes.screenPadding,
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: space.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    ...shadow.floating,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
});

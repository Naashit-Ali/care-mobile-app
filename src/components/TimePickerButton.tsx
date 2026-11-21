import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, font, ms, radius, shadow, space, type } from '../theme';
import { Button } from './Button';
import { Chip } from './Chip';

const pad = (n: number) => String(n).padStart(2, '0');
const toHHmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fromHHmm = (t?: string) => {
  const d = new Date();
  const [h, m] = (t ?? '08:00').split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};

type Props = { label?: string; initial?: string; onPick: (hhmm: string) => void };

/** "+ Add time" chip that opens the native time picker (Android dialog, iOS wheel in a bottom sheet). */
export function TimePickerButton({ label = 'Add time', initial, onPick }: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(() => fromHHmm(initial));
  const [webValue, setWebValue] = useState('');

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webRow}>
        <TextInput
          style={styles.webInput}
          value={webValue}
          onChangeText={setWebValue}
          placeholder="HH:mm"
          placeholderTextColor={colors.textSubtle}
          maxLength={5}
        />
        <Button
          label="Add"
          size="sm"
          block={false}
          disabled={!/^([01]\d|2[0-3]):[0-5]\d$/.test(webValue)}
          onPress={() => {
            onPick(webValue);
            setWebValue('');
          }}
        />
      </View>
    );
  }

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: fromHHmm(initial),
        mode: 'time',
        is24Hour: true,
        onValueChange: (_, date) => onPick(toHHmm(date)),
      });
    } else {
      setDraft(fromHHmm(initial));
      setIosOpen(true);
    }
  };

  return (
    <>
      <Chip label={label} icon="add" dashed onPress={open} />
      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Pick a time</Text>
            <DateTimePicker
              value={draft}
              mode="time"
              display="spinner"
              is24Hour
              locale="en_GB"
              themeVariant="light"
              textColor={colors.black}
              onValueChange={(_, date) => setDraft(date)}
            />
            <View style={styles.sheetButtons}>
              <Button label="Cancel" variant="secondary" style={styles.half} onPress={() => setIosOpen(false)} />
              <Button
                label="Add time"
                style={styles.half}
                onPress={() => {
                  setIosOpen(false);
                  onPick(toHHmm(draft));
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    padding: ms(20),
    paddingBottom: ms(40),
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.floating,
  },
  handle: { alignSelf: 'center', width: ms(36), height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: space.md },
  sheetTitle: { ...type.h2, color: colors.black },
  sheetButtons: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
  half: { flex: 1 },
  webRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  webInput: {
    flex: 1,
    height: ms(44),
    fontFamily: font.regular,
    fontSize: ms(16),
    color: colors.black,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
  },
});

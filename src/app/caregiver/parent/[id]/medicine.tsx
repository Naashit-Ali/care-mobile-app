import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { createMedicine, listMedicines, updateMedicine } from '@/api/endpoints';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { ErrorText, Field } from '@/components/Field';
import { Loading, Screen } from '@/components/Screen';
import { TimePickerButton } from '@/components/TimePickerButton';
import { colors, space, type } from '@/theme';

const PRESETS = ['08:00', '13:00', '20:00'];
const MAX_TIMES = 6;

/** Add a medicine, or edit one when `medicineId` is passed. */
export default function MedicineForm() {
  const { id, medicineId } = useLocalSearchParams<{ id: string; medicineId?: string }>();
  const editing = !!medicineId;
  const [loading, setLoading] = useState(editing);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [critical, setCritical] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!medicineId) return;
    listMedicines(id)
      .then((meds) => {
        const m = meds.find((x) => x._id === medicineId);
        if (!m) throw new Error('Medicine not found');
        setName(m.name);
        setDose(m.dose);
        setTimes(m.times);
        setCritical(m.critical);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, medicineId]);

  const toggle = (t: string) =>
    setTimes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t].sort()));

  const addTime = (t: string) => {
    setError('');
    if (times.includes(t)) return;
    if (times.length >= MAX_TIMES) return setError(`At most ${MAX_TIMES} times per day`);
    setTimes((cur) => [...cur, t].sort());
  };

  const save = async () => {
    setSaving(true);
    setError('');
    const body = { name: name.trim(), dose: dose.trim() || '1 pill', times, critical };
    try {
      if (medicineId) await updateMedicine(medicineId, body);
      else await createMedicine(id, body);
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!name.trim() && times.length > 0;

  if (loading) return <Loading label="Loading medicine…" />;

  return (
    <Screen
      footer={<Button label={editing ? 'Save changes' : 'Save medicine'} onPress={save} disabled={!canSave} loading={saving} />}
    >
      <Text style={styles.h2}>{editing ? 'Edit medicine' : 'Add medicine'}</Text>

      <Field label="Medicine name" value={name} onChangeText={setName} placeholder="e.g. Aspirin" maxLength={60} />
      <Field label="Dose" value={dose} onChangeText={setDose} placeholder="1 pill" maxLength={60} />

      <View style={styles.group}>
        <Text style={styles.label}>Times</Text>
        <View style={styles.chips}>
          {[...new Set([...PRESETS, ...times])].sort().map((t) => {
            const on = times.includes(t);
            return <Chip key={t} label={t} selected={on} icon={on ? 'checkmark' : undefined} onPress={() => (on ? toggle(t) : addTime(t))} />;
          })}
          <TimePickerButton onPick={addTime} />
        </View>
        {times.length === 0 && <Text style={styles.hint}>Pick at least one time.</Text>}
      </View>

      <Card variant="alt" style={styles.toggleRow}>
        <View style={styles.flex}>
          <Text style={styles.toggleTitle}>Critical medicine</Text>
          <Text style={styles.hint}>Heart, blood pressure… The agent escalates faster.</Text>
        </View>
        <Switch
          value={critical}
          onValueChange={setCritical}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.border}
        />
      </Card>

      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  h2: { ...type.h1, color: colors.black, marginBottom: space.sm },
  group: { gap: space.sm },
  label: { ...type.caption, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  hint: { ...type.caption, color: colors.textSubtle },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm },
  toggleTitle: { ...type.bodyStrong, color: colors.black },
});

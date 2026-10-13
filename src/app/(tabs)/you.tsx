import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { cloudConfigured, deleteAccount, signIn, signOut, signUp, syncNow, useSession, useSyncStatus } from '@/data/cloud';
import { C } from '@/theme';
import { Button, Chip, Screen, Section, Title } from '@/ui';

export default function You() {
  const session = useSession();
  const status = useSyncStatus();

  return (
    <Screen>
      <Title sub="Account and sync">You</Title>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {!cloudConfigured ? (
          <Section label="Account">
            <Text style={{ color: C.ink, fontSize: 15, lineHeight: 22 }}>
              Cloud sync is not set up, so your closet lives on this phone only. Add a Supabase project to `.env` to sign in and sync between devices.
            </Text>
          </Section>
        ) : session === undefined ? null : session ? (
          <Section label="Account">
            <Text style={{ color: C.ink, fontSize: 16 }}>{session.user.email}</Text>
            <Text style={{ color: status.state === 'error' ? C.danger : C.mute, fontSize: 14 }}>
              {status.state === 'syncing'
                ? 'Syncing…'
                : status.state === 'error'
                  ? `Sync paused (${status.error}). Your closet still works offline.`
                  : status.last
                    ? `Synced ${new Date(status.last).toLocaleTimeString()}`
                    : 'Not synced yet'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button kind="ghost" label="Sync now" icon="refresh" busy={status.state === 'syncing'} onPress={() => void syncNow()} style={{ flex: 1 }} />
              <Button kind="ghost" label="Sign out" onPress={() => void signOut()} style={{ flex: 1 }} />
            </View>
          </Section>
        ) : (
          <SignIn />
        )}

        <Section label="Privacy">
          <Text style={{ color: C.ink, fontSize: 15, lineHeight: 22 }}>
            Photos and closet details are stored on this phone, and in your private cloud folder when you sign in. Only you can read them. Location is used once, when you tap &ldquo;Use where I am&rdquo;, and never in the background.
          </Text>
        </Section>

        {cloudConfigured && session ? (
          <Section label="Danger zone">
            <Button
              kind="danger"
              label="Delete my account"
              onPress={() =>
                Alert.alert('Delete your account?', 'This permanently erases your closet, looks and photos from the cloud and this phone.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete everything',
                    style: 'destructive',
                    onPress: () => deleteAccount().catch((e) => Alert.alert('Could not delete', String(e?.message ?? e))),
                  },
                ])
              }
            />
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function SignIn() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setNote(null);
    const { data, error } = await (mode === 'in' ? signIn(email.trim(), password) : signUp(email.trim(), password));
    setBusy(false);
    if (error) setNote(error.message);
    else if (mode === 'up' && !data.session) setNote('Check your email to confirm, then sign in.');
  }

  const field = {
    borderWidth: 1, borderColor: C.line, backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.ink,
  } as const;

  return (
    <Section label={mode === 'in' ? 'Sign in' : 'Create account'}>
      <TextInput style={field} placeholder="Email" placeholderTextColor={C.mute} autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} accessibilityLabel="Email" />
      <TextInput style={field} placeholder="Password (6+ characters)" placeholderTextColor={C.mute} secureTextEntry autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={password} onChangeText={setPassword} accessibilityLabel="Password" />
      {note ? <Text style={{ color: C.danger }}>{note}</Text> : null}
      <Button label={mode === 'in' ? 'Sign in' : 'Create account'} busy={busy} disabled={!email || password.length < 6} onPress={submit} />
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Chip small label={mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'} onPress={() => setMode(mode === 'in' ? 'up' : 'in')} />
      </View>
    </Section>
  );
}

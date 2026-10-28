import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { t } from '@/i18n';

import { color, layout, space } from '../../tokens';
import { PrimaryButton } from '../PrimaryButton';
import { Text } from '../Text';

type Props = { children: ReactNode; /** Shown in logs to tell boundaries apart. */ name: string };
type State = { error: Error | null };

/**
 * The one class component (CODE_STANDARDS: `componentDidCatch` has no hook equivalent).
 * Wraps the root and each tab, so one broken screen never takes the app down.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error(`[ErrorBoundary:${this.props.name}]`, error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.root} accessibilityRole="alert">
        <Text variant="title.s" align="center">
          {t('common.errorTitle')}
        </Text>
        <Text variant="body" tone="muted" align="center" style={styles.body}>
          {t('common.errorBody')}
        </Text>
        <View style={styles.action}>
          <PrimaryButton label={t('common.tryAgain')} variant="light" onPress={this.reset} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg.canvas,
    justifyContent: 'center',
    paddingHorizontal: layout.state.textX,
  },
  body: { marginTop: space.sm },
  action: { marginTop: space.xxl },
});

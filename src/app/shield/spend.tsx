import { Redirect } from 'expo-router';

/**
 * iOS: the shield's "Spend 10 min" can't show UI (ShieldAction only closes or defers), so it
 * sends a notification that lands here; the app runs the breath and the "why" question, then
 * spends the minutes (the native side lifts that app's shield).
 */
export default function ShieldSpend() {
  return <Redirect href={{ pathname: '/shield', params: { strength: 'pause' } }} />;
}

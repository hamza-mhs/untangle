import { fireEvent, render, screen } from '@testing-library/react-native';

import { OnboardingHeader } from './OnboardingHeader';

describe('OnboardingHeader', () => {
  test('back button, labelled progress and counter', async () => {
    const onBack = jest.fn();
    await render(<OnboardingHeader step={2} total={15} onBack={onBack} />);
    expect(screen.getByLabelText('Step 2 of 15')).toBeTruthy();
    // Decorative duplicate of the progress label, hidden from screen readers.
    expect(screen.getByText('2/15', { includeHiddenElements: true })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

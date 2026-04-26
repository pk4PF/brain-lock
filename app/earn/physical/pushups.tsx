import PhysicalTaskScreen from '../../../src/components/earn/PhysicalTaskScreen';

export default function PushupsScreen() {
  return (
    <PhysicalTaskScreen
      task="pushups"
      title="Pushups"
      description="Ground-facing strength. Chest, shoulders, triceps."
      gradient={['#EA580C', '#9A3412']}
      instructions={[
        'Hands shoulder-width apart, body in a straight line.',
        'Lower until your chest nearly touches the ground.',
        'Push back up with control. Full range of motion counts.',
      ]}
    />
  );
}

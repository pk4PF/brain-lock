import PhysicalTaskScreen from '../../../src/components/earn/PhysicalTaskScreen';

export default function SquatsScreen() {
  return (
    <PhysicalTaskScreen
      task="squats"
      title="Squats"
      description="Lower-body power. Quads, glutes, hamstrings."
      gradient={['#0891B2', '#164E63']}
      instructions={[
        'Feet shoulder-width apart, toes slightly out.',
        'Lower hips until thighs are at least parallel to the ground.',
        'Drive through the heels to stand. Keep your chest up.',
      ]}
    />
  );
}

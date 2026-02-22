import { YStack, styled } from 'tamagui';

export const GlowCard = styled(YStack, {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  padding: 20,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,

  variants: {
    accent: {
      true: {
        borderColor: 'rgba(245,166,35,0.20)',
      },
    },
    elevated: {
      true: {
        shadowColor: '#F5A623',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 20,
        elevation: 6,
      },
    },
    subtle: {
      true: {
        backgroundColor: '#F0F1F5',
        borderColor: '#E5E7EB',
      },
    },
    glass: {
      true: {
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderColor: '#E5E7EB',
      },
    },
    interactive: {
      true: {
        pressStyle: {
          scale: 0.98,
          opacity: 0.9,
        },
      },
    },
    size: {
      sm: { padding: 14, borderRadius: 14 },
      md: { padding: 20, borderRadius: 20 },
      lg: { padding: 24, borderRadius: 24 },
    },
  } as const,
});

// Compact stat card
export const StatCard = styled(YStack, {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  padding: 16,
  alignItems: 'center',
  gap: 4,
  flex: 1,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 2,

  variants: {
    highlighted: {
      true: {
        borderColor: 'rgba(245,166,35,0.20)',
        shadowColor: '#F5A623',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        elevation: 4,
      },
    },
  } as const,
});

// Row item card for lists
export const ListCard = styled(YStack, {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  padding: 16,
  marginBottom: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 4,
  elevation: 1,

  variants: {
    interactive: {
      true: {
        pressStyle: {
          scale: 0.985,
          opacity: 0.85,
          backgroundColor: '#F0F1F5',
        },
      },
    },
    accent: {
      true: {
        borderColor: 'rgba(245,166,35,0.15)',
      },
    },
    noteStyle: {
      true: {
        borderLeftWidth: 3,
        borderLeftColor: '#F5A623',
      },
    },
  } as const,
});

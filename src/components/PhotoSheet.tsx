import { Image, StyleSheet, Text, View } from 'react-native';
import type { LayoutSlot } from '../database/queries';

export type PhotoSheetPlan = {
  photoWidth: number;
  photoHeight: number;
  paperWidth: number;
  paperHeight: number;
  columns: number;
  rows: number;
  copies: number;
  marginX: number;
  marginY: number;
  gap: number;
  slots?: LayoutSlot[];
};

type PhotoSheetProps = {
  imageUri?: string;
  plan: PhotoSheetPlan;
  backgroundColor: string;
  maxCopies?: number;
  fixedWidth?: number;
  photoText?: string;
  textFont?: string;
  textSize?: number;
  textColor?: string;
  textBackground?: string | null;
};

export function PhotoSheet({
  imageUri,
  plan,
  backgroundColor,
  maxCopies = plan.copies,
  fixedWidth,
  photoText,
  textFont = 'system',
  textSize = 20,
  textColor = '#111827',
  textBackground = null,
}: PhotoSheetProps) {
  const effectiveMaxCopies = Math.max(1, maxCopies);
  const slots = (
    plan.slots ??
    Array.from({ length: plan.copies }, (_, index) => ({
      photoWidth: plan.photoWidth,
      photoHeight: plan.photoHeight,
      left:
        plan.marginX +
        (index % Math.max(1, plan.columns)) * (plan.photoWidth + plan.gap),
      top:
        plan.marginY +
        Math.floor(index / Math.max(1, plan.columns)) *
          (plan.photoHeight + plan.gap),
    }))
  ).slice(0, effectiveMaxCopies);

  const hasText = !!photoText?.trim();

  return (
    <View
      style={[
        styles.sheet,
        {
          width: fixedWidth ? fixedWidth : '100%',
          backgroundColor: backgroundColor || '#ffffff',
          aspectRatio: plan.paperWidth / plan.paperHeight,
        },
      ]}
    >
      {slots.map((slot, index) => {
        const leftPct = (slot.left / plan.paperWidth) * 100;
        const topPct = (slot.top / plan.paperHeight) * 100;
        const widthPct = (slot.photoWidth / plan.paperWidth) * 100;
        const heightPct = (slot.photoHeight / plan.paperHeight) * 100;

        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#d1d5db',
              overflow: 'hidden',
              flexDirection: 'column',
            }}
          >
            <View style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.photo}
                  resizeMode="cover"
                  fadeDuration={0}
                />
              ) : (
                <View style={styles.placeholderPhoto} />
              )}
            </View>
            {hasText && (
              <View
                style={{
                  width: '100%',
                  paddingVertical: 2,
                  paddingHorizontal: 1,
                  backgroundColor: textBackground ?? '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderTopWidth: 0.5,
                  borderTopColor: '#e5e7eb',
                }}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                  style={{
                    color: textColor,
                    fontSize: Math.max(8, Math.min(textSize * 0.45, 14)),
                    fontFamily: textFont === 'system' ? undefined : textFont,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  {photoText}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
});

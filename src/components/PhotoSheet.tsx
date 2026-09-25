import { Image, StyleSheet, View } from 'react-native';
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
};

export function PhotoSheet({
  imageUri,
  plan,
  backgroundColor,
  maxCopies = plan.copies,
  fixedWidth,
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
            }}
          >
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

import { Image, StyleSheet, View } from 'react-native';
import { useState } from 'react';
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
};

export function PhotoSheet({ imageUri, plan, backgroundColor, maxCopies = plan.copies, fixedWidth }: PhotoSheetProps & { fixedWidth?: number }) {
  const [sheetWidth, setSheetWidth] = useState(fixedWidth || 0);
  const scale = sheetWidth > 0 ? sheetWidth / plan.paperWidth : 0;
  const slots = (plan.slots ?? Array.from({ length: plan.copies }, (_, index) => ({
    photoWidth: plan.photoWidth,
    photoHeight: plan.photoHeight,
    left: plan.marginX + (index % Math.max(1, plan.columns)) * (plan.photoWidth + plan.gap),
    top: plan.marginY + Math.floor(index / Math.max(1, plan.columns)) * (plan.photoHeight + plan.gap),
  }))).slice(0, maxCopies);

  return (
    <View
      onLayout={event => {
        if (!fixedWidth) setSheetWidth(event.nativeEvent.layout.width);
      }}
      style={[styles.sheet, { backgroundColor, aspectRatio: plan.paperWidth / plan.paperHeight }]}
    >
      {imageUri && scale > 0 && slots.map((slot, index) => {
        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: slot.left * scale,
              top: slot.top * scale,
              width: slot.photoWidth * scale,
              height: slot.photoHeight * scale,
              backgroundColor: '#ffffff',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: '#d1d5db',
              overflow: 'hidden',
            }}
          >
            <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="contain" resizeMethod="scale" />
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
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});

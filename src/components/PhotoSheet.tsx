import { Image, StyleSheet, View } from 'react-native';
import { useState } from 'react';

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
  const marginX = plan.marginX * scale;
  const marginY = plan.marginY * scale;
  const gap = plan.gap * scale;
  const photoWidth = plan.photoWidth * scale;
  const photoHeight = plan.photoHeight * scale;
  const count = Math.min(plan.copies, maxCopies);

  return (
    <View
      onLayout={event => {
        if (!fixedWidth) setSheetWidth(event.nativeEvent.layout.width);
      }}
      style={[styles.sheet, { backgroundColor, aspectRatio: plan.paperWidth / plan.paperHeight }]}
    >
      {imageUri && scale > 0 && Array.from({ length: count }, (_, index) => {
        const column = index % plan.columns;
        const row = Math.floor(index / plan.columns);
        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: marginX + column * (photoWidth + gap),
              top: marginY + row * (photoHeight + gap),
              width: photoWidth,
              height: photoHeight,
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

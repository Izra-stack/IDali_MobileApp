import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLayoutPlan, getPackagePlan, ID_PACKAGES, ID_PHOTO_SIZES, type IdPackage } from '../../database/queries';
import { persistSharedState, SharedState } from '../../SharedState';
import styles from '../../styles/services/id-size-set.styles';

function PackageThumbnail({ packageId, idSize }: { packageId: string; idSize: string }) {
  const plan = getPackagePlan(packageId, idSize);
  const maxWidth = plan.paperWidth;
  const maxHeight = plan.paperHeight;
  return <View style={[styles.thumbnail, { aspectRatio: maxWidth / maxHeight }]}>
    {plan.slots?.map((slot, index) => <View key={`${packageId}-${index}`} style={[styles.thumbnailPhoto, {
      left: `${(slot.left / maxWidth) * 100}%`, top: `${(slot.top / maxHeight) * 100}%`, width: `${(slot.photoWidth / maxWidth) * 100}%`, height: `${(slot.photoHeight / maxHeight) * 100}%`,
    }]} />)}
  </View>;
}

export default function IdSizeSetScreen() {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState(SharedState.idSize || '2x2 inches');
  const [selectedPackage, setSelectedPackage] = useState(SharedState.packageId || 'a4-package');
  const selectedPackageData = useMemo(() => ID_PACKAGES.find(item => item.id === selectedPackage) ?? ID_PACKAGES[ID_PACKAGES.length - 1], [selectedPackage]);

  const packageSize = (item: IdPackage) => item.mixed || item.sizeName === 'Selected size' ? selectedSize : item.sizeName;
  const packagePlan = (item: IdPackage) => getPackagePlan(item.id, packageSize(item), item.paperSize);
  const usePackage = (item: IdPackage) => {
    const size = packageSize(item);
    SharedState.idSize = size;
    SharedState.packageId = item.id;
    SharedState.paperSize = item.paperSize;
    void persistSharedState();
    router.push('/(services)/preview');
  };

  return <SafeAreaView style={styles.safeArea}>
    <View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#111827" /></TouchableOpacity><Text style={styles.headerTitle}>ID Size Set</Text><View style={{ width: 32 }} /></View>
    <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.introCard}><Text style={styles.introTitle}>Choose a print-ready ID set</Text><Text style={styles.introText}>Pick an ID photo size, then choose a package. The preview and export will use the exact dimensions and automatic A4 spacing.</Text></View>
      <Text style={styles.sectionTitle}>ID Photo Size</Text><Text style={styles.sectionText}>Select the physical size of one photo.</Text>
      <View style={styles.sizeRow}>{ID_PHOTO_SIZES.map(size => <TouchableOpacity key={size.name} style={[styles.sizeChip, selectedSize === size.name && styles.sizeChipActive]} onPress={() => { setSelectedSize(size.name); if (selectedPackageData.sizeName === 'Selected size') setSelectedPackage('a4-package'); }} accessibilityRole="button" accessibilityState={{ selected: selectedSize === size.name }}><Text style={[styles.sizeChipText, selectedSize === size.name && styles.sizeChipTextActive]}>{size.name}</Text><Text style={[styles.sizeChipSubtext, selectedSize === size.name && styles.sizeChipSubtextActive]}>{size.width_mm} × {size.height_mm} mm</Text></TouchableOpacity>)}</View>
      <Text style={styles.sectionTitle}>ID Package / Print Set</Text><Text style={styles.sectionText}>Use a preset layout or let IDali fill an A4 page.</Text>
      {ID_PACKAGES.map(item => {
        const plan = packagePlan(item); const active = selectedPackage === item.id;
        return <View key={item.id} style={[styles.packageCard, active && styles.packageCardActive]}>
          <PackageThumbnail packageId={item.id} idSize={packageSize(item)} />
          <View style={styles.packageBody}><Text style={styles.packageName}>{item.name}</Text><Text style={styles.packageMeta}>{item.mixed ? item.copiesLabel : `${packageSize(item)} · ${plan.copies} copies on ${item.paperSize}`}</Text><Text style={styles.packageDescription}>{item.description}</Text><TouchableOpacity style={styles.useButton} onPress={() => { setSelectedPackage(item.id); usePackage(item); }}><Text style={styles.useButtonText}>Use Package</Text></TouchableOpacity></View>
        </View>;
      })}
      <View style={{ height: 12 }} />
    </ScrollView>
  </SafeAreaView>;
}

import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useDatabase } from '../../database/DatabaseProvider';
import { SharedState } from '../../SharedState';
import styles from '../../styles/services/layout-settings.styles';

export default function LayoutSettingsScreen() {
  const router = useRouter();
  const db = useDatabase();
  
  const [idSizes, setIdSizes] = useState<{name: string, width_mm: number, height_mm: number}[]>([]);
  const [idSize, setIdSize] = useState('2x2');
  const [paperSize, setPaperSize] = useState('A4');
  const [bgColor, setBgColor] = useState('White');

  useEffect(() => {
    async function loadSizes() {
      try {
        const result = await db.getAllAsync('SELECT * FROM id_sizes');
        if (result && result.length > 0) {
          setIdSizes(result as any[]);
          setIdSize((result[0] as any).name);
        } else {
          setIdSizes([
            { name: '1x1', width_mm: 25.4, height_mm: 25.4 },
            { name: '2x2', width_mm: 50.8, height_mm: 50.8 },
            { name: 'Passport Size', width_mm: 35, height_mm: 45 }
          ]);
        }
      } catch (error) {
        console.error("Failed to load sizes from SQLite:", error);
      }
    }
    loadSizes();
  }, []);

  const handleNext = () => {
    SharedState.idSize = idSize;
    SharedState.paperSize = paperSize;
    SharedState.bgColor = bgColor;
    router.push('/(services)/preview');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Layout Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>ID Size Selection</Text>
        <Text style={styles.subtitle}>Choose the dimensions for your ID photo</Text>

        <View style={styles.optionsContainer}>
          {idSizes.length > 0 ? idSizes.map((sizeObj) => (
            <TouchableOpacity 
              key={sizeObj.name}
              style={[styles.optionCard, idSize === sizeObj.name && styles.optionCardActive]} 
              onPress={() => setIdSize(sizeObj.name)}>
              <View style={[styles.optionIconContainer, idSize === sizeObj.name && styles.optionIconContainerActive]}>
                <Ionicons name="person" size={24} color={idSize === sizeObj.name ? '#ffffff' : '#3b74f6'} />
              </View>
              <View>
                <Text style={[styles.optionTitle, idSize === sizeObj.name && styles.optionTitleActive]}>{sizeObj.name}</Text>
                <Text style={{fontSize: 10, color: idSize === sizeObj.name ? '#dbeafe' : '#9ca3af'}}>{sizeObj.width_mm}x{sizeObj.height_mm}mm</Text>
              </View>
              {idSize === sizeObj.name && <Ionicons name="checkmark-circle" size={24} color="#3b74f6" style={{marginLeft: 'auto'}}/>}
            </TouchableOpacity>
          )) : (
            <Text style={{color: '#9ca3af', padding: 10}}>Loading sizes from database...</Text>
          )}
        </View>

        <Text style={[styles.title, {marginTop: 20}]}>Paper Size Selection</Text>
        <Text style={styles.subtitle}>Select the paper to print your layout</Text>
        <View style={styles.optionsContainer}>
          {['A4', '4R', 'Letter'].map((size) => (
            <TouchableOpacity 
              key={size}
              style={[styles.optionCard, paperSize === size && styles.optionCardActive]} 
              onPress={() => setPaperSize(size)}>
              <View style={[styles.optionIconContainer, paperSize === size && styles.optionIconContainerActive]}>
                <Ionicons name="document-outline" size={24} color={paperSize === size ? '#ffffff' : '#3b74f6'} />
              </View>
              <Text style={[styles.optionTitle, paperSize === size && styles.optionTitleActive]}>{size}</Text>
              {paperSize === size && <Ionicons name="checkmark-circle" size={24} color="#3b74f6" style={{marginLeft: 'auto'}} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.title, {marginTop: 20}]}>Background Color</Text>
        <View style={styles.colorGrid}>
          {['White', 'Blue', 'Red', 'Transparent'].map((color) => (
            <TouchableOpacity 
              key={color}
              style={[styles.colorChip, bgColor === color && styles.colorChipActive]}
              onPress={() => setBgColor(color)}
            >
              <Text style={[styles.colorText, bgColor === color && styles.colorTextActive]}>{color}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.generateButton} onPress={handleNext}>
          <Ionicons name="grid-outline" size={20} color="#ffffff" style={{marginRight: 8}} />
          <Text style={styles.generateButtonText}>Generate Layout</Text>
        </TouchableOpacity>
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

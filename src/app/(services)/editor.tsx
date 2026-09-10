import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SharedState } from '../../SharedState';
import styles from '../../styles/services/editor.styles';

export default function EditorScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Photo</Text>
        <TouchableOpacity style={styles.nextButton} onPress={() => router.push('/(services)/layout-settings')}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.imageWorkspace}>
          {SharedState.imageUri ? (
            <Image 
              source={{ uri: SharedState.imageUri }} 
              style={{ width: '100%', height: '100%', borderRadius: 16 }} 
              resizeMode="contain" 
            />
          ) : (
            <Ionicons name="person" size={100} color="#9ca3af" />
          )}
        </View>

        <View style={styles.toolsContainer}>
          <Text style={styles.toolsTitle}>Editing Tools</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolsScroll}>
            <TouchableOpacity style={styles.toolItem}>
              <View style={styles.toolIcon}>
                <Ionicons name="crop" size={24} color="#3b74f6" />
              </View>
              <Text style={styles.toolText}>Crop</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolItem}>
              <View style={styles.toolIcon}>
                <Ionicons name="color-wand" size={24} color="#3b74f6" />
              </View>
              <Text style={styles.toolText}>Remove BG</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolItem}>
              <View style={styles.toolIcon}>
                <Ionicons name="options" size={24} color="#3b74f6" />
              </View>
              <Text style={styles.toolText}>Adjust</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolItem}>
              <View style={styles.toolIcon}>
                <Ionicons name="text" size={24} color="#3b74f6" />
              </View>
              <Text style={styles.toolText}>Text</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolItem}>
              <View style={styles.toolIcon}>
                <Ionicons name="filter" size={24} color="#3b74f6" />
              </View>
              <Text style={styles.toolText}>Filter</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

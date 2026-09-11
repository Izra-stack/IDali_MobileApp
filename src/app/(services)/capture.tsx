import { View, Text, TouchableOpacity, StyleSheet, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { persistSharedState, SharedState } from '../../SharedState';
import styles from '../../styles/services/capture.styles';

// Screen: camera capture and local photo handoff to the editor.
export default function CaptureScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={localStyles.permissionContainer}>
        <Text style={localStyles.permissionText}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  // Event handler: switch between front and rear cameras.
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // API/event handler: capture a photo and open the editor.
  const handleCapture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync();
      if (photo?.uri) {
        SharedState.imageUri = photo.uri;
        await persistSharedState();
        router.push('/(services)/editor');
      }
    } catch {
      // The camera mount and permission states provide the user-facing recovery path.
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Capture Photo</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instructionText}>Position your face in the frame</Text>
        
        <View style={localStyles.cameraContainer}>
          <CameraView style={localStyles.camera} facing={facing} flash={flash} ref={cameraRef}>
            <View style={localStyles.overlay}>
              <View style={localStyles.frame} />
            </View>
          </CameraView>
        </View>
        
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setFlash(current => (current === 'off' ? 'on' : 'off'))}
            accessibilityLabel="Toggle flash"
          >
            <Ionicons name={flash === 'on' ? 'flash' : 'flash-outline'} size={24} color="#374151" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: '70%',
    height: '70%',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
});

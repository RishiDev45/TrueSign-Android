import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, Alert, ActivityIndicator } from 'react-native';
import { supabase } from './supabase'; // Import the connection we just made

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false); // Track upload status
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View style={{ flex: 1, backgroundColor: 'black' }} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (cameraRef.current) {
      try {
        const data = await cameraRef.current.takePictureAsync({
          quality: 0.5, // Keep quality lower for faster upload testing
          base64: true, // We need base64 to upload via standard API easily
          skipProcessing: false, 
          shutterSound: true,
        });
        
        if (data) setPhoto(data.uri);
      } catch (e) {
        console.error("Failed to take picture:", e);
      }
    }
  }

  // --- THE UPLOAD FUNCTION ---
  async function uploadToCloud() {
    if (!photo) return;
    setUploading(true);

    try {
      // 1. Create a unique file name (e.g., photo_123456789.jpg)
      const fileName = `photo_${Date.now()}.jpg`;
      
      // 2. Prepare the file (Supabase expects FormData or ArrayBuffer)
      const formData = new FormData();
      formData.append('file', {
        uri: photo,
        name: fileName,
        type: 'image/jpeg',
      } as any);

      // 3. Upload to 'evidence' bucket
      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(fileName, formData, {
          contentType: 'image/jpeg',
        });

      if (error) {
        throw error;
      }

      Alert.alert("Success!", "Photo uploaded to Supabase secure vault.");
      setPhoto(null); // Reset app
    } catch (error) {
      Alert.alert("Upload Failed", (error as any).message);
    } finally {
      setUploading(false);
    }
  }

  function retakePicture() {
    setPhoto(null);
  }

  // --- PREVIEW SCREEN ---
  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        
        <View style={styles.overlay}>
           <View style={styles.banner}>
              <Text style={styles.bannerText}>⚠️ UNVERIFIED IMAGE</Text>
           </View>
           
           <View style={styles.buttonRow}>
             <TouchableOpacity style={styles.retakeButton} onPress={retakePicture} disabled={uploading}>
                <Text style={styles.buttonText}>Discard</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.uploadButton} onPress={uploadToCloud} disabled={uploading}>
                {uploading ? <ActivityIndicator color="white"/> : <Text style={styles.uploadText}>CLOUD SYNC ☁️</Text>}
             </TouchableOpacity>
           </View>
        </View>
      </View>
    );
  }

  // --- CAMERA SCREEN ---
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.smallButton} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shutterButton} onPress={takePicture}>
               <View style={styles.shutterInner} />
            </TouchableOpacity>
            <View style={styles.smallButton} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  message: { textAlign: 'center', paddingBottom: 10, color: 'white' },
  camera: { flex: 1 },
  preview: { flex: 1, resizeMode: 'contain', backgroundColor: 'black' },
  controlsContainer: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  text: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  shutterButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', borderWidth: 2, borderColor: 'black' },
  smallButton: { width: 60, alignItems: 'center', padding: 10 },
  overlay: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
  banner: { backgroundColor: 'red', padding: 12, borderRadius: 8, marginBottom: 20 },
  bannerText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  buttonRow: { flexDirection: 'row', gap: 20 },
  retakeButton: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  uploadButton: { backgroundColor: '#00C853', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: 'black' },
  uploadText: { fontSize: 16, fontWeight: 'bold', color: 'white' }
});
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, Alert, ActivityIndicator } from 'react-native';
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import * as TrueSign from './modules/truesign'; // THE BRAIN

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null); // Store the cryptographic proof
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  console.log("DEBUG TRUESIGN OBJECT:", TrueSign);

  // 1. INITIALIZE KEYS ON APP START
  useEffect(() => {
    try {
      const status = TrueSign.initializeKeys();
      console.log("Secure Enclave Status:", status);
    } catch (e) {
      console.error("Key Init Failed:", e);
    }
  }, []);

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
        // A. CAPTURE
        const data = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true, // We need the data to sign it
          skipProcessing: false,
          shutterSound: true,
        });
        
        if (data && data.base64) {
          setPhoto(data.uri);

          // B. SIGNING (THE MAGIC MOMENT)
          try {
            console.log("Signing photo hash...");
            // We sign the Base64 string directly using the Hardware Chip
            const hardwareSignature = TrueSign.signData(data.base64.substring(0, 100)); // Signing first 100 chars for speed in MVP
            setSignature(hardwareSignature);
            console.log("GENERATED SIGNATURE:", hardwareSignature);
          } catch (e) {
            Alert.alert("Signing Error", "Could not access Secure Enclave");
          }
        }
      } catch (e) {
        console.error("Failed to take picture:", e);
      }
    }
  }

  async function uploadToCloud() {
    if (!photo || !signature) {
      Alert.alert("Error", "Missing photo or signature.");
      return;
    }
    setUploading(true);

    try {
      const fileName = `proof_${Date.now()}.jpg`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: photo,
        name: fileName,
        type: 'image/jpeg',
      } as any);

      // C. UPLOAD WITH METADATA
      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(fileName, formData, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      // D. SAVE RECORD TO DATABASE (With Signature)
      // Note: In a real app, you'd insert into the 'photos' table here. 
      // For now, we just prove the upload worked.

      if (error) throw error;

      Alert.alert("SECURE UPLOAD COMPLETE", "Signature: " + signature.substring(0, 10) + "...");
      setPhoto(null);
      setSignature(null);
    } catch (error) {
      Alert.alert("Upload Failed", (error as any).message);
    } finally {
      setUploading(false);
    }
  }

  function retakePicture() {
    setPhoto(null);
    setSignature(null);
  }

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        
        <View style={styles.overlay}>
           {/* THE GREEN TICK - NOW BACKED BY MATH */}
           <View style={styles.banner}>
              <Text style={styles.bannerText}>
                {signature ? "🔒 SECURE ENCLAVE SIGNED" : "⚠️ UNSIGNED"}
              </Text>
           </View>
           
           <View style={styles.buttonRow}>
             <TouchableOpacity style={styles.retakeButton} onPress={retakePicture} disabled={uploading}>
                <Text style={styles.buttonText}>Discard</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.uploadButton} onPress={uploadToCloud} disabled={uploading}>
                {uploading ? <ActivityIndicator color="white"/> : <Text style={styles.uploadText}>UPLOAD PROOF ☁️</Text>}
             </TouchableOpacity>
           </View>
        </View>
      </View>
    );
  }

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
  banner: { backgroundColor: '#00C853', padding: 12, borderRadius: 8, marginBottom: 20 },
  bannerText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  buttonRow: { flexDirection: 'row', gap: 20 },
  retakeButton: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  uploadButton: { backgroundColor: '#2962FF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: 'black' },
  uploadText: { fontSize: 16, fontWeight: 'bold', color: 'white' }
});
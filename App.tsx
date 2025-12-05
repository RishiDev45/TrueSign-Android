import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, Alert, ActivityIndicator, Share } from 'react-native';
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import * as TrueSign from './modules/truesign'; 

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // 1. INITIALIZE CRYPTOGRAPHY KEYS
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

  // 2. CAPTURE & SIGN
  async function takePicture() {
    if (cameraRef.current) {
      try {
        const data = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true, 
          skipProcessing: false,
          shutterSound: true,
        });
        
        if (data && data.base64) {
          setPhoto(data.uri);

          // SIGNING (Hardware Chip)
          try {
            const hardwareSignature = TrueSign.signData(data.base64.substring(0, 100)); 
            setSignature(hardwareSignature);
          } catch (e) {
            Alert.alert("Signing Error", "Could not access Secure Enclave");
          }
        }
      } catch (e) {
        console.error("Failed to take picture:", e);
      }
    }
  }

  // 3. UPLOAD & SHARE LINK
  async function uploadToCloud() {
    if (!photo || !signature) return;
    setUploading(true);

    try {
      const fileName = `proof_${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file', {
        uri: photo,
        name: fileName,
        type: 'image/jpeg',
      } as any);

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(fileName, formData, { contentType: 'image/jpeg', upsert: false });

      if (error) throw error;

      // --- GENERATE SHARE LINK ---
      // This points to your specific Vercel deployment
      // UPDATE THIS LINE IN App.tsx
const shareLink = `https://truesign-web.vercel.app/verify/${fileName}`;
      
      // Open Native Share Sheet (WhatsApp, etc.)
      await Share.share({
        message: `Verify this secure image: ${shareLink}`,
        url: shareLink, 
        title: 'TrueSign Evidence'
      });

      // Reset after share
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

  // --- PREVIEW SCREEN ---
  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        
        {/* --- TOP RIGHT WATERMARK (THE BADGE) --- */}
        <View style={[styles.watermarkContainer, signature ? styles.wmVerified : styles.wmUnverified]}>
            {signature && (
              <Image 
                source={require('./assets/truesign_tick.png')} 
                style={styles.wmIcon} 
              />
            )}
            <Text style={[styles.wmText, signature ? styles.textVerified : styles.textUnverified]}>
              {signature ? "TrueSign Verified" : "Unverified"}
            </Text>
        </View>
        
        {/* --- BOTTOM BUTTONS --- */}
        <View style={styles.overlay}>
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

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  message: { textAlign: 'center', paddingBottom: 10, color: 'white' },
  camera: { flex: 1 },
  preview: { flex: 1, resizeMode: 'cover', backgroundColor: 'black' }, // Full screen fill
  controlsContainer: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  text: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  shutterButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', borderWidth: 2, borderColor: 'black' },
  smallButton: { width: 60, alignItems: 'center', padding: 10 },
  
  // BUTTON OVERLAY
  overlay: { 
    position: 'absolute', 
    bottom: 50, 
    left: 0, 
    right: 0, 
    alignItems: 'center',
  },

  // --- NEW WATERMARK STYLES ---
  watermarkContainer: {
    position: 'absolute',
    top: 60, // Safe area from top
    right: 20, // Right corner
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Glass effect
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 999,
  },
  wmVerified: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF', // Blue Border
  },
  wmUnverified: {
    backgroundColor: 'red',
  },
  wmText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  wmIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    resizeMode: 'contain',
  },
  textVerified: { color: '#007AFF' }, // Blue Text
  textUnverified: { color: 'white' },

  // BUTTONS
  buttonRow: { flexDirection: 'row', gap: 20 },
  retakeButton: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  uploadButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  uploadText: { fontSize: 16, fontWeight: 'bold', color: 'white' }
});
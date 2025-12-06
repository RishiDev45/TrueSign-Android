import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, Alert, ActivityIndicator, Share, Modal, FlatList, Linking } from 'react-native';
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library'; 
import * as TrueSign from './modules/truesign'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; // Storage for History

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  
  // PERMISSIONS
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions(); 

  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // HISTORY STATE
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const cameraRef = useRef<CameraView>(null);

  // 1. INITIALIZE KEYS, PERMISSIONS & LOAD HISTORY
  useEffect(() => {
    (async () => {
      try {
        const status = TrueSign.initializeKeys();
        console.log("Secure Enclave Status:", status);
        
        if (!mediaPermission?.granted) {
            await requestMediaPermission();
        }
        loadHistory(); // Load history on startup
      } catch (e) {
        console.error("Init Failed:", e);
      }
    })();
  }, []);

  // --- HISTORY FUNCTIONS ---
  const loadHistory = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@truesign_history');
      if (jsonValue != null) {
        setHistoryData(JSON.parse(jsonValue));
      }
    } catch(e) {
      console.log("Error loading history", e);
    }
  }

  const saveToHistory = async (link: string) => {
    try {
      const newItem = {
        id: Date.now().toString(),
        link: link,
        date: new Date().toLocaleString()
      };
      const updatedHistory = [newItem, ...historyData];
      setHistoryData(updatedHistory); // Update UI
      await AsyncStorage.setItem('@truesign_history', JSON.stringify(updatedHistory)); // Save to storage
    } catch (e) {
      console.log("Error saving history", e);
    }
  }

  const deleteHistoryItem = async (id: string) => {
      const updatedHistory = historyData.filter(item => item.id !== id);
      setHistoryData(updatedHistory);
      await AsyncStorage.setItem('@truesign_history', JSON.stringify(updatedHistory));
  }
  // -------------------------

  if (!cameraPermission) return <View style={{ flex: 1, backgroundColor: 'black' }} />;
  if (!cameraPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need camera permission</Text>
        <Button onPress={requestCameraPermission} title="grant permission" />
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
          quality: 0.5,
          base64: true, 
          skipProcessing: false,
          shutterSound: true,
        });
        
        if (data && data.base64) {
          setPhoto(data.uri);
          
          try {
            if (mediaPermission?.granted) {
                await MediaLibrary.createAssetAsync(data.uri);
                console.log("Saved to Gallery");
            }
          } catch (e) {
            console.log("Gallery Save Error:", e);
          }

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

      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(fileName, formData, { contentType: 'image/jpeg', upsert: false });

      if (error) throw error;

      // YOUR PRODUCTION LINK
      const shareLink = `https://truesign-web.vercel.app/verify/${fileName}`;
      
      // SAVE TO LOCAL HISTORY
      saveToHistory(shareLink);

      try {
        await Share.share({
          message: `Verify this secure image: ${shareLink}`,
          url: shareLink, 
          title: 'TrueSign Evidence'
        });
      } catch (error) {
        console.error(error);
      }
      
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
        
        <View style={styles.overlay}>
           <View style={styles.buttonRow}>
             <TouchableOpacity style={styles.retakeButton} onPress={retakePicture} disabled={uploading}>
                <Text style={styles.buttonText}>Discard</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.uploadButton} onPress={uploadToCloud} disabled={uploading}>
                {uploading ? <ActivityIndicator color="white"/> : <Text style={styles.uploadText}>UPLOAD PROOF  ☁ ️</Text>}
             </TouchableOpacity>
           </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        
        {/* HISTORY BUTTON (Top Left) */}
        <TouchableOpacity style={styles.historyButton} onPress={() => setHistoryVisible(true)}>
            <Text style={styles.historyText}>📜 History</Text>
        </TouchableOpacity>

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

      {/* HISTORY MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={historyVisible}
        onRequestClose={() => setHistoryVisible(false)}
      >
        <View style={styles.modalView}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Proof History</Text>
                <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                    <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
            </View>
            
            {historyData.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No proofs generated yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={historyData}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{paddingBottom: 20}}
                    renderItem={({ item }) => (
                        <View style={styles.historyItem}>
                            <View style={{flex: 1}}>
                                <Text style={styles.historyDate}>{item.date}</Text>
                                <Text style={styles.historyLink} numberOfLines={1}>{item.link}</Text>
                            </View>
                            <View style={styles.historyActions}>
                                <TouchableOpacity 
                                    style={styles.actionBtn} 
                                    onPress={() => Linking.openURL(item.link)}
                                >
                                    <Text style={styles.actionText}>Open</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, {backgroundColor: '#333'}]} 
                                    onPress={() => Share.share({message: item.link})}
                                >
                                    <Text style={styles.actionText}>Share</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  message: { textAlign: 'center', paddingBottom: 10, color: 'white' },
  camera: { flex: 1 },
  preview: { flex: 1, resizeMode: 'cover', backgroundColor: 'black' },
  controlsContainer: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  text: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  shutterButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', borderWidth: 2, borderColor: 'black' },
  smallButton: { width: 60, alignItems: 'center', padding: 10 },
  
  overlay: { 
    position: 'absolute', 
    bottom: 50, 
    left: 0, 
    right: 0, 
    alignItems: 'center',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 60, 
    right: 20,   
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 999, 
  },
  wmVerified: { backgroundColor: 'white', borderColor: '#007AFF' },
  wmUnverified: { backgroundColor: 'red' },
  wmText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  wmIcon: { width: 14, height: 14, marginRight: 6, resizeMode: 'contain' },
  textVerified: { color: '#007AFF' },
  textUnverified: { color: 'white' },
  
  buttonRow: { flexDirection: 'row', gap: 20 },
  retakeButton: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  uploadButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  uploadText: { fontSize: 16, fontWeight: 'bold', color: 'white' },

  // HISTORY STYLES
  historyButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  historyText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  
  modalView: {
    flex: 1,
    backgroundColor: '#121212',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  closeText: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: 'gray', fontSize: 16 },
  
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  historyDate: { color: 'gray', fontSize: 12, marginBottom: 4 },
  historyLink: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  historyActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
});
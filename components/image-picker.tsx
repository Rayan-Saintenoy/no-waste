import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ImagePickerProps {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
}

export default function AddProductScreen({ imageUri, onImageSelected }: ImagePickerProps) {

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "Vous devez autoriser l'accès à la galerie.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      await saveImagePermanently(result.assets[0].uri, result.assets[0].fileName);
    }
  };

  const saveImagePermanently = async (tempUri: string, fileName?: string | null) => {
    try {
      const newFileName = fileName || `product_${Date.now()}.jpg`;
      const permanentPath = `${FileSystem.documentDirectory}${newFileName}`;

      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentPath,
      });
      
      // On renvoie le chemin au composant parent (ScanScreen)
      onImageSelected(permanentPath);

    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'image localement.');
    }
  };

  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
            <Feather name="edit-2" size={16} color="white" />
            <Text style={styles.changeText}>Modifier la photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={pickImage}>
          <Feather name="camera" size={24} color="#2E7D32" />
          <Text style={styles.addText}>Ajouter une photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 15, marginBottom: 5 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderStyle: 'dashed',
  },
  addText: { marginLeft: 10, color: '#2E7D32', fontWeight: '700' },
  imageContainer: { alignItems: 'center' },
  image: { width: 120, height: 120, borderRadius: 15 },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    position: 'absolute',
    bottom: 5,
  },
  changeText: { color: 'white', marginLeft: 5, fontSize: 12, fontWeight: '600' },
});
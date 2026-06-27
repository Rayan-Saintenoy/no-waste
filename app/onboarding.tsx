import db from "@/app/database/database";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, Leaf, Mail, ScanLine, ShoppingBasket, User as UserIcon } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Bienvenue sur NoWaste',
    description: 'Gérez votre frigo et vos placards facilement. Fini les produits oubliés au fond du bac !',
    Icon: ShoppingBasket, 
  },
  {
    id: '2',
    title: 'Scannez vos courses',
    description: "Ajoutez vos produits en un clin d'œil grâce à notre scanner de code-barres intégré.",
    Icon: ScanLine,
  },
  {
    id: '3',
    title: 'Zéro gaspillage',
    description: 'Suivez les dates de péremption et recevez des alertes pour consommer à temps.',
    Icon: Leaf,
  },
  {
    id: '4',
    title: 'Faisons connaissance',
    description: 'Renseignez vos informations pour personnaliser votre expérience.',
    isForm: true, 
  }
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [mail, setMail] = useState('');

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const completeOnboarding = async () => {
    if (prenom.trim() === '' || nom.trim() === '' || mail.trim() === '') {
      Alert.alert(
        "Informations manquantes",
        "Veuillez remplir tous les champs (Prénom, Nom et Email) pour continuer.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      await db.runAsync(
        "INSERT INTO utilisateur (firstname, name, mail) VALUES (?, ?, ?);",
        [prenom, nom, mail]
      );
      console.log("Utilisateur enregistré dans SQLite avec succès !");

      await AsyncStorage.setItem('@onboarding_complete', 'true');
      router.replace('/');
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'onboarding", error);
      Alert.alert("Erreur", "Un problème est survenu lors de l'enregistrement. Veuillez réessayer.");
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
    if (item.isForm) {
      return (
        <View style={{ width, flex: 1 }}>
          <ScrollView 
            contentContainerStyle={[styles.slide, { flexGrow: 1, justifyContent: 'center', paddingTop: 0 }]}
            keyboardShouldPersistTaps="handled" 
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
            
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <UserIcon size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Prénom"
                  value={prenom}
                  onChangeText={setPrenom}
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.inputContainer}>
                <UserIcon size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nom"
                  value={nom}
                  onChangeText={setNom}
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.inputContainer}>
                <Mail size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Adresse email"
                  value={mail}
                  onChangeText={setMail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#888"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }

    // Rend les slides classiques avec les icônes
    const IconComponent = item.Icon!;
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.iconContainer}>
          <IconComponent size={80} color="#2E7D32" strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.header}>
          {/* L'option 'Passer' a été commentée, on force l'utilisateur à remplir le formulaire à la fin */}
        </View>

        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentIndex === index && styles.activeDot
                ]}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {currentIndex === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
            </Text>
            {currentIndex === SLIDES.length - 1 ? (
              <Check size={20} color="#FFF" style={styles.buttonIcon} />
            ) : (
              <ArrowRight size={20} color="#FFF" style={styles.buttonIcon} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 50,
  },
  skipButton: {
    padding: 10,
  },
  skipText: { 
    fontSize: 16, 
    color: '#666', 
    fontWeight: '600' 
  },
  skipPlaceholder: {
    width: 60,
  },
  slide: { 
    alignItems: 'center', 
    paddingHorizontal: 30, 
    paddingTop: 40 
  },
  iconContainer: {
    width: 180, 
    height: 180, 
    borderRadius: 90,
    backgroundColor: '#E8F5E9', 
    justifyContent: 'center',
    alignItems: 'center', 
    marginBottom: 50,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#1B5E20', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  description: { 
    fontSize: 16, 
    color: '#555', 
    textAlign: 'center', 
    lineHeight: 24 
  },
  formContainer: {
    width: '100%',
    marginTop: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  footer: { 
    paddingHorizontal: 20, 
    paddingBottom: 20,
    marginTop: 'auto',
  },
  pagination: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 30 
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#E0E0E0', 
    marginHorizontal: 5 
  },
  activeDot: { 
    backgroundColor: '#2E7D32', 
    width: 24 
  },
  button: { 
    flexDirection: 'row',
    backgroundColor: '#2E7D32', 
    paddingVertical: 16, 
    borderRadius: 25, 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: '700' 
  },
  buttonIcon: {
    marginLeft: 10,
  }
});
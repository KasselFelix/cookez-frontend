import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Animated } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

const ProfilScreen = () => {
  const route = useRoute();
  const user = useSelector((state)=>state.user.value);

  const animatedValue = new Animated.Value(0);

  // Animation à l'apparition
  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={{...styles.profileHeader, opacity: animatedValue}}>
        <Image source={{ uri: user?.image }} style={styles.profileImage} />
        <Text style={styles.profileName}>{user?.firstname} {user?.lastname}</Text>
        <Text style={styles.profileUsername}>@{user?.username}</Text>
      </Animated.View>

      <View style={styles.profileInfo}>
        <Text style={styles.infoTitle}>Email:</Text>
        <Text style={styles.infoText}>{user?.email}</Text>

        <Text style={styles.infoTitle}>Age:</Text>
        <Text style={styles.infoText}>{user?.age} ans</Text>

        <Text style={styles.infoTitle}>Genre:</Text>
        <Text style={styles.infoText}>{user?.settings?.gender}</Text>

        <Text style={styles.infoTitle}>Allergies:</Text>
        <Text style={styles.infoText}>
          {user?.settings?.allergies.length > 0
            ? user.settings.allergies.join(', ')
            : 'Aucune'}
        </Text>

        <Text style={styles.infoTitle}>Composition du foyer:</Text>
        <Text style={styles.infoText}>
          {user?.settings?.householdComposition}
        </Text>

        <Text style={styles.infoTitle}>Peut poster:</Text>
        <Text style={styles.infoText}>{user?.canpost ? 'Oui' : 'Non'}</Text>

        <Text style={styles.infoTitle}>Recettes favorites:</Text>
        <Text style={styles.infoText}>{user?.favorites.length}</Text>

        <Text style={styles.infoTitle}>Recettes publiées:</Text>
        <Text style={styles.infoText}>{user?.recipes.length}</Text>

        <Text style={styles.infoTitle}>Commentaires:</Text>
        <Text style={styles.infoText}>{user?.comments.length}</Text>
      </View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileUsername: {
    fontSize: 18,
    color: '#777',
  },
  profileInfo: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ProfilScreen;


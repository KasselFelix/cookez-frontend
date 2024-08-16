import React, { useEffect ,useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, StyleSheet, Image, ScrollView, Animated, TouchableOpacity, Modal } from 'react-native';
import MyButton from '../modules/MyButton';
import buttonStyles from '../styles/Button';
import css from '../styles/Global';
import { removeUserToStore } from '../reducers/user';

const ProfilScreen = ({navigation}) => {

  const dispatch=useDispatch();
  const user =useSelector((state)=>state.user.value);
  const [modalVisible, setModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(require('../assets/profile/avatar_M.jpg'));
  const animatedValue = new Animated.Value(0);

  // Animation d'apparition avec interpolation
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);


  const handleImageChange = (newImage) => {
    setProfileImage(newImage);
    setModalVisible(false);
  };

  const Genre = ['M','F'];

  // Interpolation de la valeur pour l'opacité et la translation
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0], // Déplacement vertical de 50 à 0
  });
  const opacity = animatedValue;

  const displayImage={
    default_M: require('../assets/profile/avatar_M.jpg'),
    default_F: require('../assets/profile/avatar_F.jpg'),
    avatar_M1:require('../assets/profile/avatar_M1.jpg'),
    avatar_M2:require('../assets/profile/avatar_M2.jpg'),
    avatar_M3:require('../assets/profile/avatar_M3.jpg'),
    avatar_M4:require('../assets/profile/avatar_M4.jpg'),
    avatar_F1:require('../assets/profile/avatar_F1.jpg'),
    avatar_F2:require('../assets/profile/avatar_F2.jpg'),
    avatar_F3:require('../assets/profile/avatar_F3.jpg'),
    avatar_F4:require('../assets/profile/avatar_F3.jpg'),
  }
  availableImages=[
    require('../assets/profile/avatar_M1.jpg'),
    require('../assets/profile/avatar_M2.jpg'),
    require('../assets/profile/avatar_M3.jpg'),
    require('../assets/profile/avatar_M4.jpg'),
    require('../assets/profile/avatar_F1.jpg'),
    require('../assets/profile/avatar_F2.jpg'),
    require('../assets/profile/avatar_F3.jpg'),
    require('../assets/profile/avatar_F4.jpg'),
  ]
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View
        style={[
          styles.profileHeader,
          {
            opacity: opacity,
            transform: [{ translateY: translateY }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image source={user.token? profileImage: (displayImage.default_M)} style={styles.profileImage} />
        </TouchableOpacity>
        <Text style={styles.profileName}>
          {user?.firstname} {user?.lastname}
        </Text>
        <Text style={styles.profileUsername}>@{user?.username}</Text>
      </Animated.View>

      <View style={styles.profileInfo}>
        <Text style={styles.infoTitle}>Email:</Text>
        <Text style={styles.infoText}>{user?.email}</Text>

        <Text style={styles.infoTitle}>Âge:</Text>
        <Text style={styles.infoText}>{user?.age} ans</Text>

        {/* <Text style={styles.infoTitle}>Genre:</Text> */}
        {/* <Text style={styles.infoText}>{user?.settings?.gender}</Text> */}

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

        <Text style={styles.infoTitle}>Recettes favorites:</Text>
        <Text style={styles.infoText}>{user?.favorites.length}</Text>

        <Text style={styles.infoTitle}>Recettes publiées:</Text>
        <Text style={styles.infoText}>{user?.recipes.length}</Text>

        <Text style={styles.infoTitle}>Commentaires:</Text>
        <Text style={styles.infoText}>{user?.comments.length}</Text>
      </View>
      <View>
      <MyButton
            dataFlow={() => {dispatch( removeUserToStore());navigation.navigate("Home")}}
            text={"LOG OUT"}
            buttonType={buttonStyles.buttonOne}
          />
      </View>
      

      {/* Modal pour sélectionner l'image */}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionnez une image</Text>
            <View style={styles.imageOptions}>
              {availableImages.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleImageChange(image)}
                >
                  <Image source={image} style={styles.optionImage} />
                </TouchableOpacity>
              ))}
            </View>
            </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop:'20%',
    flexGrow: 1,
    padding: 20,
    backgroundColor: css.backgroundColorTwo,
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
    borderColor: css.backgroundColorOne,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileUsername: {
    fontSize: 18,
    color: css.backgroundColorOne,
  },
  profileInfo: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginBottom:30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: css.inactiveButtonColor,
    marginTop: 10,
  },
  infoText: {
    fontSize: 16,
    color: css.backgroundColorTwo,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    height:342,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    flexWrap:'wrap',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imageOptions: {
    height:250,
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap : 'wrap',
    justifyContent: 'space-around'
  },
  optionImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
});

export default ProfilScreen;




// const ProfilScreen = () => {
//   const user =useSelector((state)=>state.user.value);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [profileImage, setProfileImage] = useState(user?.image);
//   const [email, setEmail] = useState(user?.email);
//   const [age, setAge] = useState(user?.age?.toString());
//   const [householdComposition, setHouseholdComposition] = useState(
//     user?.settings?.householdComposition?.toString()
//   );
//   const [allergies, setAllergies] = useState(user?.settings?.allergies || []);
//   const [newAllergy, setNewAllergy] = useState('');
//   const animatedValue = new Animated.Value(0);


//   // Images disponibles dans le répertoire assets


//   React.useEffect(() => {
//     Animated.timing(animatedValue, {
//       toValue: 1,
//       duration: 1000,
//       useNativeDriver: true,
//     }).start();
//   }, []);

//   const translateY = animatedValue.interpolate({
//     inputRange: [0, 1],
//     outputRange: [50, 0],
//   });

//   const opacity = animatedValue;

//   const handleImageChange = (newImage) => {
//     setProfileImage(newImage);
//     setModalVisible(false); // Ferme la modal après la sélection
//   };

//   const handleAddAllergy = () => {
//     if (newAllergy.trim() !== '' && !allergies.includes(newAllergy)) {
//       setAllergies([...allergies, newAllergy]);
//       setNewAllergy('');
//     }
//   };

//   const handleRemoveAllergy = (allergy) => {
//     setAllergies(allergies.filter((item) => item !== allergy));
//   };

//   const handleSave = () => {
//     // Validation de l'email
//     if (!email.includes('@')) {
//       Alert.alert('Erreur', "Veuillez entrer un email valide.");
//       return;
//     }

//     // Validation de l'âge
//     const ageNumber = parseInt(age, 10);
//     if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 130) {
//       Alert.alert('Erreur', "Veuillez entrer un âge valide (1-130).");
//       return;
//     }

//     // Validation de la composition du foyer
//     const householdNumber = parseInt(householdComposition, 10);
//     if (isNaN(householdNumber) || householdNumber < 1) {
//       Alert.alert('Erreur', "Veuillez entrer une composition du foyer valide.");
//       return;
//     }

//     // Simuler la sauvegarde des données ici
//     Alert.alert('Succès', "Les modifications ont été enregistrées.");
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Animated.View
//         style={[
//           styles.profileHeader,
//           {
//             opacity: opacity,
//             transform: [{ translateY: translateY }],
//           },
//         ]}
//       >
//         <TouchableOpacity onPress={() => setModalVisible(true)}>
        
//         </TouchableOpacity>
//         <Text style={styles.profileName}>
//           {user?.firstname} {user?.lastname}
//         </Text>
//         <Text style={styles.profileUsername}>@{user?.username}</Text>
//       </Animated.View>

//       <View style={styles.profileInfo}>
//         <Text style={styles.infoTitle}>Email:</Text>
//         <TextInput
//           style={styles.input}
//           value={email}
//           onChangeText={setEmail}
//           keyboardType="email-address"
//         />

//         <Text style={styles.infoTitle}>Âge:</Text>
//         <TextInput
//           style={styles.input}
//           value={age}
//           onChangeText={setAge}
//           keyboardType="numeric"
//         />

//         <Text style={styles.infoTitle}>Composition du foyer:</Text>
//         <TextInput
//           style={styles.input}
//           value={householdComposition}
//           onChangeText={setHouseholdComposition}
//           keyboardType="numeric"
//         />

//         <Text style={styles.infoTitle}>Allergies:</Text>
//         <View style={styles.allergyList}>
//           {allergies.map((allergy, index) => (
//             <View key={index} style={styles.allergyItem}>
//               <Text style={styles.allergyText}>{allergy}</Text>
//               <TouchableOpacity
//                 style={styles.removeButton}
//                 onPress={() => handleRemoveAllergy(allergy)}
//               >
//                 <Text style={styles.removeButtonText}>X</Text>
//               </TouchableOpacity>
//             </View>
//           ))}
//         </View>

//         <TextInput
//           style={styles.input}
//           value={newAllergy}
//           onChangeText={setNewAllergy}
//           placeholder="Ajouter une allergie"
//         />
//         <Button title="Ajouter" onPress={handleAddAllergy} />
//       </View>

//       <Button title="Sauvegarder" onPress={handleSave} />

//       {/* Modal pour sélectionner l'image */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Sélectionnez une image</Text>
//             <View style={styles.imageOptions}>
             
//             </View>
//             <Button title="Fermer" onPress={() => setModalVisible(false)} />
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     padding: 20,
//     backgroundColor: '#f0f4f8',
//     alignItems: 'center',
//   },
//   profileHeader: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   profileImage: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     borderWidth: 2,
//     borderColor: '#ddd',
//     marginBottom: 10,
//   },
//   profileName: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   profileUsername: {
//     fontSize: 18,
//     color: '#777',
//   },
//   profileInfo: {
//     width: '100%',
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//     elevation: 5,
//   },
//   infoTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 10,
//   },
//   input: {
//     fontSize: 16,
//     color: '#666',
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//     marginBottom: 10,
//     paddingVertical: 5,
//   },
//   allergyList: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginBottom: 10,
//   },
//   allergyItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#e0e0e0',
//     borderRadius: 15,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     margin: 5,
//   },
//   allergyText: {
//     marginRight: 10,
//     color: '#333',
//   },
//   removeButton: {
//     backgroundColor: '#ff5252',
//     borderRadius: 10,
//     padding: 2,
//   },
//   removeButtonText: {
//     color: '#fff',
//     fontSize: 12,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     width: 300,
//     padding: 20,
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   imageOptions: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: 20,
//   },
//   optionImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 10,
//   },
// });
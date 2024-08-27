import React, { useState } from 'react';
import { StyleSheet, View, Image, Platform, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Unicons from '@iconscout/react-native-unicons';
import css from '../styles/Global';
import { addPictureToStore } from '../reducers/picture';
import { useDispatch,  useSelector } from 'react-redux';

export default function ImageSelector() {
    const [image, setImage] = useState(null);
    const dispatch=useDispatch();

    const pickImage = async () => {
        // Demande de permission
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
        alert("Permission to access camera roll is required!");
        return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        });

        console.log(result);

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            dispatch(addPictureToStore(result.assets[0].uri))
        }
    };

    const takePhoto = async () => {
        // Demande de permission
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            alert("Permission to access camera is required!");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        });

        console.log(result);

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            dispatch(addPictureToStore(result.assets[0].uri))
        }
    };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {image ? 
        <Image source={{ uri: image }} style={{ width: 200, height: 200,borderRadius:20, borderWidth:5, borderColor:css.inactiveButtonColor }} />:
        <View style={styles.container}> 
            <TouchableOpacity onPress={() =>takePhoto()}>
                <Unicons.UilCameraPlus size={60} color={css.inactiveButtonColor}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={() =>pickImage()}>
                <Unicons.UilImageSearch size={60} color={css.inactiveButtonColor}/>
            </TouchableOpacity >
        </View>
    }
    </View>
  );
}


const styles = StyleSheet.create({
    container:{
        flexDirection:'row',
        justifyContent:'space-around',
        width:'100%',
    }

})
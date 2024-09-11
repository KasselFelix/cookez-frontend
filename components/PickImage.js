import React from 'react';
import { TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
//import * as ImageManipulator from 'expo-image-manipulator';
import * as Unicons from '@iconscout/react-native-unicons';
import css from '../styles/Global';
import { addPictureToStore } from '../reducers/picture';
import { useDispatch } from 'react-redux';

export default function PickImage(props) {
    const dispatch=useDispatch();

    const pickImage = async () => {
        if(props.name){
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
                dispatch(addPictureToStore(result.assets[0].uri))
            }
        }else{
            alert("fill the fields above before ✍️")
        }
    };

    

  return (
    <TouchableOpacity onPress={() =>pickImage()}>
        <Unicons.UilImageSearch size={60} color={css.inactiveButtonColor}/>
    </TouchableOpacity > 
  );
}


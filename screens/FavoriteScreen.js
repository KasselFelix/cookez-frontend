import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from "react-redux";
import MySmallButton from '../components/MySmallButton';
import addressIp from '../modules/addressIp';
import buttonStyles from '../styles/Button';
import css from '../styles/Global';

import Recipe from '../components/Recipe';

export default function FavoriteScreen({ navigation, route }) {
    const [refreshing, setRefreshing] = React.useState(false);

    const user = useSelector((state) => state.user.value);
    const recipes = useSelector((state) => state.recipe.value);

    const onRefresh = React.useCallback(() => {
      console.log('REFRESH')
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }, [navigation]);

    const handleReturn = () => {
        navigation.goBack()
    }

    // On fusionne : pour chaque favori de l'user, on cherche la version à jour dans le store recipe
    const favoritesData = user.favorites?.map(fav => {
        const updatedRecipe = recipes.find(r => r._id === (fav._id || fav));
        return updatedRecipe ? updatedRecipe : fav;
    }) || [];

    const favorites = favoritesData.map((data, i) => {
        //console.log('Rendering favorite recipe:', data);
        return  <Recipe key={data._id} {...data} navigation={navigation} />
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <MySmallButton
                	dataFlow={handleReturn}
                  text={<FontAwesome name='angle-double-left' size={30} color={'white'}/>}
                  buttonType={buttonStyles.buttonSmall}
                />
                { favorites.length === 1 ? <Text style={styles.titlePage}> My favorite ❤️</Text> :  <Text style={styles.titlePage}>My favorites ❤️</Text>}
            </View>
            { favorites.length === 0 && <View style={styles.noFavoriteContainer}>
              <View style={styles.noFavorite}><Text>No favorites in your list </Text><Text>at the moment 😔 ...</Text></View>
            </View> }

            <ScrollView contentContainerStyle={styles.galleryContainer} 
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}>
            {favorites}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
      container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: '15%',
        backgroundColor: css.palette.accent500
      }, 
    
      header: {
        flex: 0,
        width: '90%',
        flexDirection: 'row',
        justifyContent: 'space-between'
      },
    
      titlePage: {
        width: '70%',
        fontSize: css.typography.h5Size,
      },

      noFavoriteContainer: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '50%',
      },

      noFavorite: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
      },

      galleryContainer: {
        marginHorizontal: '7%',
      },
})
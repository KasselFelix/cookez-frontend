import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React from "react";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";
import MySmallButton from "../modules/MySmallButton";

import FontAwesome from "react-native-vector-icons/FontAwesome";

export default function RecipeScreen({ navigation }) {
  const selectedRecipe = {
    id: "idrecipe",
    name: "Tacos Al Pastor",
    origin: "Mexique",
    ingredients: [
      {
        name: "Porc",
        image: "porc.jpg",
        quantity: 500,
        nutrition: {
          vitamine_A: 0,
          vitamine_B: 1.3,
          glycemic_index: 0,
          calories: 242,
        },
      },
      {
        name: "Ananas",
        image: "ananas.jpg",
        quantity: 200,
        nutrition: {
          vitamine_A: 3,
          vitamine_B: 0.1,
          glycemic_index: 66,
          calories: 50,
        },
      },
    ],
    difficulty: 3,
    note: 4,
    votes: ["iduser1", "iduser2"],
    picture: "Tacos_Al_Pastor.jpg",
    preparationTime: 60,
    description:
      "Un plat traditionnel mexicain avec du porc mariné et de l'ananas.",
    steps: [
      "Mariner le porc avec les épices.",
      "Faire cuire le porc et l'ananas.",
      "Servir dans des tortillas chaudes.",
    ],
    Comments: [],
  };

  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <FontAwesome
        key={i}
        name="star"
        size={25}
        color={i < selectedRecipe.note ? "#d4b413" : "#9c9c98"}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MySmallButton
          dataFlow={() => navigation.goBack()}
          text={
            <FontAwesome name="angle-double-left" size={30} color={"white"} />
          }
          buttonType={buttonStyles.buttonSmall}
        />
      </View>

      {/* BLOC RECETTE SELECTED  */}

      <View style={styles.pictureBloc}>
        <Text style={styles.sectionsTitle}>{selectedRecipe.name}</Text>
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder} />
          <TouchableOpacity style={styles.favoriteButton}>
            <FontAwesome name="heart-o" size={24} color="grey" />
          </TouchableOpacity>
        </View>
        <View style={styles.stars}>{stars}</View>
        <View style={styles.textUnder}>
          <Text style={styles.infos}>
            Prep: {selectedRecipe.preparationTime} min
          </Text>
          <Text style={styles.infos}>
            Difficulty: {selectedRecipe.difficulty}/5
          </Text>
        </View>
      </View>

      {/* BLOC INGREDIENTS */}

      <View style={styles.recipeBloc}>
        <Text style={styles.sectionsTitle}>Ingredients</Text>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text> 200g de poulet,</Text>
            <Text> 300g de chou</Text>
            <Text> 300g de riz</Text>
            <Text> 2cc de sel</Text>
            <Text> 2càs de sauce soja</Text>
            <Text> 1càs de nuoc mâm</Text>
          </View>
        </ScrollView>
      </View>

      {/* BLOC STEPS */}

      <View style={styles.recipeBloc}>
        <Text style={styles.sectionsTitle}>Étapes</Text>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text>1. Mariner le poulet avec les épices.</Text>
            <Text>2. Faire cuire le poulet et l'ananas.</Text>
            <Text>3. Ajouter les épices et bien mélanger.</Text>
            <Text>4. Laisser mijoter 5 minutes.</Text>
            <Text>5. Servir dans des tortillas chaudes.</Text>
            <Text>6. Bon app!.</Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.separator} />

      {/* BLOC COMMENTAIRES */}

      <View style={styles.commentsBloc}>
        <Text style={styles.sectionsTitle}>Commentaires</Text>
        <View style={styles.content}>
          <Text>Cette recette est blablablaaaaa</Text>
          <Text>blablablaaaaaaaaaaa</Text>
        </View>
      </View>

      {/* BOUTON  */}
      <MyButton
        dataFlow={() => navigation.navigate("MoreFeatures")}
        text="More Features"
        buttonType={buttonStyles.buttonTwo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: css.backgroundColorOne,
    paddingTop: 20,
  },
  header: {
    flex: 0,
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
  },

  pictureBloc: {
    width: "90%",
    height: 180,
    backgroundColor: css.backgroundColorTwo,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  sectionsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  imageContainer: {
    // position: "relative",
    marginBottom: 5,
  },
  imagePlaceholder: {
    width: "100%",
    height: 80,
    backgroundColor: "#ddd",
    borderRadius: 8,
  },
  favoriteButton: {
    position: "absolute",
    top: 5,
    right: 5,
  },

  stars: {
    flexDirection: "row",
  },
  textUnder: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  infos: {
    fontSize: 12,
  },
  recipeBloc: {
    width: "90%",
    height: 150,
    backgroundColor: css.backgroundColorTwo,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  separator: {
    height: 1,
    width: "90%",
    backgroundColor: "black",
    marginVertical: 16,
  },
  commentsBloc: {
    width: "90%",
    height: 100,
    backgroundColor: css.backgroundColorTwo,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  content: {
    paddingBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
});

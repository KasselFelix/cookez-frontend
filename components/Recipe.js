import { FontAwesome } from "@expo/vector-icons";
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import css from "../styles/Global";
import MatchBadge from './result/MatchBadge';
import SeasonalBadge from './result/SeasonalBadge';
import { flagForOriginName } from '../modules/countries';

const formatOrigin = (origin) => {
  const items = Array.isArray(origin) ? origin : origin ? [origin] : [];
  return items.map((name) => `${flagForOriginName(name)} ${name}`).join(' · ');
};

/**
 * Recipe card — partagé entre ResultScreen (search flow) et FavoriteScreen.
 * Par défaut, le card ne propage AUCUN servings override à RecipeScreen.
 * `fromRecipeSearch={true}` doit être passé UNIQUEMENT depuis ResultScreen
 * (qui présuppose un passage par RecapScreen). Sinon RecipeScreen tombera
 * sur la branche `householdComposition` ou `recipe.servings` selon le
 * contexte (user loggué vs guest).
 */
export default function Recipe( props ) {

  

    const note =
      Array.isArray(props.votes) && props.votes.length
        ? Math.floor(props.votes.reduce((acc, v) => acc + v.note, 0) / props.votes.length)
        : 0;

    const voteRecipe= () => {
      let stars = [];
      for (let i=0; i < 5; i++) {
        stars.push(<FontAwesome key={i} name='star' size={18} color={i < note ? "#FFD700" : "#C0C0C0"} />) //#d4b413
      }

      return stars;
    }


    return (
        <View style={styles.shadowWrap}>
          <TouchableOpacity
            style={styles.recipeContainer}
            activeOpacity={0.9}
            onPress={() => {
              props.navigation.navigate('Recipe', {
                recipe: {
                  _id:             props._id,
                  name:            props.name,
                  description:     props.description,
                  ingredients:     props.ingredients,
                  steps:           props.steps,
                  votes:           props.votes,
                  origin:          props.origin,
                  picture:         props.picture,
                  date:            props.date,
                  preparationTime: props.preparationTime,
                  difficulty:      props.difficulty,
                },
                fromRecipeSearch: props.fromRecipeSearch === true,
              });
            }}
          > 
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{props.name}</Text>
              <Text> {formatOrigin(props.origin)}</Text>
            </View>
            <View style={styles.imageContainer}>
              <Image 
                style={styles.image} 
                source={{uri: `https://res.cloudinary.com/dnym6kt4p/image/upload/${props.picture}.jpg?_a=BAMAGSWO0` }|| null} 
                alt="picture of one recipe" accessibilityLabel="picture of one recipe"
              />
              <View style={styles.voteContainer}> 
                <View style={styles.vote}>
                  {voteRecipe()}
                </View>
                  <Text> votes: {props.votes?.length ?? 0}</Text>
              </View>
            </View>
            <View style={styles.badgeRow}>
              <MatchBadge ratio={props.matchRatio} />
              {props.isSeasonal && <SeasonalBadge />}
            </View>
            <View style={styles.infos}>
              <Text style={styles.text}>Difficulty: {props.difficulty}/5</Text>
              <Text style={styles.text}>Preparation Time: {props.preparationTime}m</Text>
            </View>
          </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({

  shadowWrap: {
    width: 330,
    height: 340,
    borderRadius: 10,
    backgroundColor: css.palette.surfaceCard,
    marginBottom: '5%',
    // iOS: shadow softened (less halo + tighter spread) to keep the card
    // grounded without overpowering the surrounding peach background.
    // Android keeps `elevation: 10` from `shadow.heavy` for visual parity.
    ...css.shadow.heavy,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {},
    }),
  },

  recipeContainer: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: css.palette.surfaceCard,
    overflow: 'hidden',
  },

  nameContainer: {
    paddingLeft: '3%',
  },

  name: {
    fontSize: css.typography.bodySize,
    fontWeight: 'bold',
  },

  imageContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: '3%',
    marginLeft: '10%',
    width: '80%',
  },

  image: {
    width: '110%',
    height: '94%',
    borderRadius: 10,
    backgroundColor: css.palette.secondary500,
  },

  voteContainer: {
    flex: 0,
    alignItems: 'flex-end',
    width: '100%',
  },

  vote:{
    flex: 0,
    flexDirection: 'row',
  },

  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: '3%',
    marginTop: 8,
  },

  infos: {
    marginTop: '6%',
    marginBottom: '3%',
    paddingLeft: '3%',
  },

  text: {
    fontSize: 16,
    },
})
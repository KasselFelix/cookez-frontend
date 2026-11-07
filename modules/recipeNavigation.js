/**
 * Opens RecipeScreen for a recipe of a list (Result, Favorites).
 * `fromRecipeSearch` is true only from ResultScreen, which follows Recap:
 * RecipeScreen then keeps the servings picked there.
 *
 * @param {{ navigate: Function }} navigation
 * @param {object} recipe
 * @param {{ fromRecipeSearch?: boolean }} [options]
 */
export function openRecipe(navigation, recipe, { fromRecipeSearch = false } = {}) {
  navigation.navigate('Recipe', {
    recipe: {
      _id: recipe._id,
      name: recipe.name,
      description: recipe.description,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      votes: recipe.votes,
      origin: recipe.origin,
      picture: recipe.picture,
      imageUrl: recipe.imageUrl,
      videoUrl: recipe.videoUrl,
      date: recipe.date,
      preparationTime: recipe.preparationTime,
      difficulty: recipe.difficulty,
    },
    fromRecipeSearch: fromRecipeSearch === true,
  });
}

export default openRecipe;

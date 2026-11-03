const imageRecipe = {
    "croissant.jpg":require('../assets/recipe/croissant.jpg'),
    "coq_au_vin.jpg":require('../assets/recipe/coq_au_vin.jpg'),
    "bouillabaisse.jpg":require('../assets/recipe/bouillabaisse.jpg'),
    "galette_des_rois.jpg":require('../assets/recipe/galette_des_rois.jpg'),
    "mousse_au_chocolat.jpg":require('../assets/recipe/mousse_au_chocolat.jpg'),
    "quiche_lorraine.jpg":require('../assets/recipe/quiche_lorraine.jpg'),
    "ratatouille.jpg":require('../assets/recipe/ratatouille.jpg'),
    "salade_nicoise.jpg":require('../assets/recipe/salade_nicoise.jpg'),
    "soupe_a_l_oignon.jpg":require('../assets/recipe/soupe_a_l_oignon.jpg'),
    "tarte_tatin.jpg":require('../assets/recipe/tarte_tatin.jpg'),
    "Croque_Monsieur.jpg": require('../assets/recipe/Croque_Monsieur.jpg'),

    // Neutral branded fallback used by `resolveRecipeImageSource` when an
    // imported recipe has no usable picture/imageUrl. A logo is intentionally
    // chosen over a real food photo so a missing image never misleads the user
    // about the dish (Plan 005 U-A16).
    "placeholder.png": require('../assets/logo/cookez_logo.png')

};

export default imageRecipe;
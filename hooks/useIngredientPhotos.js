import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIngredientPhoto, loadableImage } from '../modules/ingredientPhoto';
import { setIngredientPhoto } from '../reducers/ingredient';

/**
 * Fills the catalog photo of every picked ingredient that has none yet, from
 * GET /ingredients/:id/photo, into the ingredient slice. Kickoff and Recap
 * mount it and both render `photo` from the slice: one source, one image.
 * Ingredients without a catalog id (a camera shot) keep their own photo.
 */
export default function useIngredientPhotos() {
  const dispatch = useDispatch();
  const ingredients = useSelector((state) => state.ingredient.value);

  useEffect(() => {
    let active = true;
    for (const ingredient of ingredients) {
      const id = ingredient?.data?._id;
      if (!id || loadableImage(ingredient.photo)) continue;
      const displayName = ingredient.data.display_name;
      fetchIngredientPhoto(String(id)).then((photo) => {
        if (active && photo) dispatch(setIngredientPhoto({ display_name: displayName, photo }));
      });
    }
    return () => {
      active = false;
    };
  }, [ingredients, dispatch]);
}

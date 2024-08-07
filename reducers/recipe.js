import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    recipe: [],
}; 

export const recipeSlice = createSlice({
    name: 'recipe',

    initialState,
    reducers: {
        addRecipeToStore: (state, action) => {
            state.recipe.push(action.payload);
        },
        removeRecipeToStore: (state, action) => {
            state.recipe = state.recipe.filter((e) => e.recipe !== action.payload.recipe)
        },
    },
});

export const { addRecipeToStore, removeRecipeToStore } = recipeSlice.actions;
export default recipeSlice.reducer;
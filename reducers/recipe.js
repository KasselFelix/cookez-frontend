import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    recipes: [],
}; 

export const recipeSlice = createSlice({
    name: 'recipe',

    initialState,
    reducers: {
        addRecipeToStore: (state, action) => {
            state.recipes.push(action.payload);
        },
        updateRecipeToStore: (state, action) => {
            state.recipes=action.payload;
        },
        removeRecipeToStore: (state, action) => {
            state.recipes = state.recipes.filter((e) => e._id !== action.payload._id)
        },
    },
});

export const { addRecipeToStore, removeRecipeToStore } = recipeSlice.actions;
export default recipeSlice.reducer;
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    value: [],
};

export const ingredientSlice = createSlice({
    name: 'ingredient',
    initialState,
    reducers: {
        addIngredient: (state, action) => {
            const name = action.payload.data.display_name.toLowerCase();
            if (!state.value.some((e) => e.data.display_name.toLowerCase() === name)) {
                state.value.push(action.payload);
            }
        },
        removeIngredient: (state, action) => {
            state.value = state.value.filter(
                (e) => e.data.display_name.toLowerCase() !== action.payload.data.display_name.toLowerCase()
            );
        },
        clearIngredients: (state) => {
            state.value = [];
        },
    },
});

export const { addIngredient, removeIngredient, clearIngredients } = ingredientSlice.actions;
export default ingredientSlice.reducer;

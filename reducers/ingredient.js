import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    value: [],
};

export const ingredientSlice = createSlice({
    name: 'ingredient',
    initialState,
    reducers: {
        addIngredient: (state, action) => {
            // Phase C.5 — dev-time guard. The backend's /recipes/result
            // validator now rejects ingredient payloads missing a Mongo
            // `_id`. Catching the omission at the dispatch site is far
            // cheaper than tracing a 400 from the algorithm later.
            //
            // Stays warning-only in __DEV__ so we don't break production
            // for users on legacy paths (e.g. Foodvisor vision results
            // that haven't yet been reconciled with our ingredients
            // collection). The warning is enough to surface the issue
            // during local exercise.
            const payload = action.payload;
            if (__DEV__ && !payload?.data?._id) {
                console.warn(
                    '[ingredient.addIngredient] payload missing data._id — backend ID validation will reject this. Payload:',
                    payload
                );
            }
            const name = payload.data.display_name.toLowerCase();
            if (!state.value.some((e) => e.data.display_name.toLowerCase() === name)) {
                state.value.push(payload);
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

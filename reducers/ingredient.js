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
            // Stays warning-only in __DEV__ so a legacy path without an id
            // never breaks production. Scanned ingredients carry their
            // catalog id (POST /vision/analyze, plan 015).
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
        // RecapScreen lets the user override the reference quantity (e.g. 250
        // instead of 100 ml) before fetching results. We persist it back into
        // the ingredient slice so navigating away and back doesn't reset the
        // input to the BDD reference value.
        updateIngredientQuantity: (state, action) => {
            const { display_name, quantity } = action.payload;
            const target = state.value.find(
                (e) => e.data.display_name.toLowerCase() === display_name.toLowerCase()
            );
            if (target) {
                target.data.g_per_serving = quantity;
            }
        },
        // Unit override per ingredient — RecapScreen exposes a picker so the
        // user can express "1 kg" or "2 tbsp" instead of being locked to the
        // ingredient's defaultUnit. The backend's `convertToBaseUnit` handles
        // all supported aliases (g, kg, mg, ml, cl, dl, l, tbsp/cs, tsp/cc).
        updateIngredientUnit: (state, action) => {
            const { display_name, unit } = action.payload;
            const target = state.value.find(
                (e) => e.data.display_name.toLowerCase() === display_name.toLowerCase()
            );
            if (target) {
                target.data.unit = unit;
            }
        },
        // Catalog photo resolved by hooks/useIngredientPhotos: Kickoff and Recap
        // both read `photo` from here, so they show the same image.
        setIngredientPhoto: (state, action) => {
            const { display_name, photo } = action.payload;
            const target = state.value.find(
                (e) => e.data.display_name.toLowerCase() === display_name.toLowerCase()
            );
            if (target) {
                target.photo = photo;
            }
        },
        // A scanned ingredient flagged "to confirm" (plan 015) that the user
        // accepted on Kickoff or Recap.
        setIngredientConfirmed: (state, action) => {
            const target = state.value.find(
                (e) => e.data.display_name.toLowerCase() === action.payload.display_name.toLowerCase()
            );
            if (target) {
                target.data.toConfirm = false;
            }
        },
        clearIngredients: (state) => {
            state.value = [];
        },
    },
});

export const { addIngredient, removeIngredient, updateIngredientQuantity, updateIngredientUnit, setIngredientPhoto, setIngredientConfirmed, clearIngredients } = ingredientSlice.actions;
export default ingredientSlice.reducer;

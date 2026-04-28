import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    value:{username:null,token:null}
}; 

export const userSlice = createSlice({
    name: 'user',

    initialState,
    reducers: {
        addUserToStore: (state, action) => {
            state.value = action.payload;
        },
        updateUserInStore: (state, action) => {
            state.value = { ...state.value, ...action.payload }; //seules les propriétés spécifiées dans action.payload seront mises à jour, tandis que les autres propriétés de state.value ne changent pas (utile pour les updates).
        },
        removeUserToStore: (state, action) => {
            state.value = {username:null,token:null};
        },
        addFavorite: (state, action) => {
            state.value.favorites.push(action.payload); 
        },
        removeFavorite: (state, action) => {
            state.value.favorites = state.value.favorites.filter(
                (fav) => fav._id !== action.payload._id 
            );
        },
        toggleFavorite: (state, action) => {
            const recipe = action.payload;
            const index = state.value.favorites.findIndex(fav => fav._id === recipe._id);

            if (index !== -1) {
                state.value.favorites.splice(index, 1);
            } else {
                state.value.favorites.push(recipe);
            }
        },
    },
});

export const { addUserToStore , updateUserInStore, removeUserToStore, addFavorite, removeFavorite, toggleFavorite } = userSlice.actions;
export default userSlice.reducer;
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
        }

    },
});

export const { addUserToStore , updateUserInStore, removeUserToStore} = userSlice.actions;
export default userSlice.reducer;
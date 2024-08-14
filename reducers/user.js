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
        removeUserToStore: (state, action) => {
            state.value = {username:null,token:null};
        }
    },
});

export const { addUserToStore , removeUserToStore} = userSlice.actions;
export default userSlice.reducer;
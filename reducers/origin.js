import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    value:null
}; 

export const originSlice = createSlice({
    name: 'origin',

    initialState,
    reducers: {
        addOriginToStore: (state, action) => {
            state.value = action.payload;
        },
        removeOriginToStore: (state) => {
            state.value = null;
        }

    },
});

export const { addOriginToStore , removeOriginToStore} = originSlice.actions;
export default originSlice.reducer;
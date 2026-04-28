import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    value: null,
};

export const pictureSlice = createSlice({
    name: 'picture',
    initialState,
    reducers: {
        setPicture: (state, action) => {
            state.value = action.payload;
        },
        clearPicture: (state) => {
            state.value = null;
        },
    },
});

export const { setPicture, clearPicture } = pictureSlice.actions;
export default pictureSlice.reducer;

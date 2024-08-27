import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    value:null
}; 

export const pictureSlice = createSlice({
    name: 'picture',

    initialState,
    reducers: {
        addPictureToStore: (state, action) => {
            state.value = action.payload;
        },
        removePictureToStore: (state) => {
            state.value = null;
        }
    },
});

export const { addPictureToStore , removePictureToStore} = pictureSlice.actions;
export default pictureSlice.reducer;
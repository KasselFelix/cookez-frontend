import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    value: null,
};

export const originSlice = createSlice({
    name: 'origin',
    initialState,
    reducers: {
        setOrigin: (state, action) => {
            state.value = action.payload;
        },
        clearOrigin: (state) => {
            state.value = null;
        },
    },
});

export const { setOrigin, clearOrigin } = originSlice.actions;
export default originSlice.reducer;

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    value: [],
};

export const commentSlice = createSlice({
    name: 'comment',
    initialState,
    reducers: {
        setComments: (state, action) => {
            state.value = action.payload;
        },
        removeComment: (state, action) => {
            state.value = state.value.filter((e) => e._id !== action.payload._id);
        },
    },
});

export const { setComments, removeComment } = commentSlice.actions;
export default commentSlice.reducer;

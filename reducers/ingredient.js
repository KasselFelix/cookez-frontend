import { createSlice} from '@reduxjs/toolkit';

const initialState={
  value: [],
};

export const ingredientSlice = createSlice({
  name: 'ingredient',
  initialState,
  reducers: {
    addIngredient: (state, action) => {
      state.value.push(action.payload);
    },
    removeIngredient: (state, action) => {
      state.value= state.value.filter((e) => e.data.display_name !== action.payload.data.display_name);
    },
    removeAllIngredient: (state, action) =>{
      state.value=[];
    }
  },
});

export const { addIngredient, removeIngredient, removeAllIngredient} = ingredientSlice.actions;
export default ingredientSlice.reducer;
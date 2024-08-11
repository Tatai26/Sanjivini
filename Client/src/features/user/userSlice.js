import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

// export const fetchUserStatus = createAsyncThunk(
//     'user/fetchUserStatus',
//     async () => {
//         try {
//             // Make your API call to fetch user status here
//             const response = await fetch('/api/user/status');
//             const data = await response.json();
//             return data.loggedIn; // Assuming your server returns the loggedIn status
//         } catch (error) {
//             // Handle errors if any
//             console.error('Error fetching user status:', error);
//             throw error;
//         }
//     }
// );

export const userSlice = createSlice({
    name: 'user',
    initialState: {
        loggedIn: false,
        _id:"",
    },
    reducers: {
        loginUser: (state,_id) => {
            state.loggedIn = true
            state._id = _id.payload
        },
        logoutUser: (state) => {
            state.loggedIn = false
            state._id=""
        },
    },
    // extraReducers: builder => {
    //     builder.addCase(fetchUserStatus.fulfilled, (state, action) => {
    //         state.loggedIn = action.payload; 
    //     });
    // },
})

export const { loginUser, logoutUser } = userSlice.actions

export default userSlice.reducer
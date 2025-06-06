import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define your base URL
const baseUrl = "https://back.biopluskw.com/api/v1";

// Create the API slice using RTK Query
export const filesApi = createApi({
  reducerPath: "filesApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      // Get the token from localStorage (or Redux state)
      // Get the token from localStorage (or Redux state)
      const token = localStorage.getItem("token");

      // If a token exists, add it to the headers
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  endpoints: (builder) => ({
   
    addFile: builder.mutation({
      query: (data) => ({
        url: "/shared/upload",
        method: "POST",
        body: data,
      }),
    }),
    addFile: builder.mutation({
      query: (data) => ({
        url: "/shared/upload",
        method: "POST",
        body: data,
      }),
    }),
    addFiles: builder.mutation({
      query: (data) => ({
        url: "shared/upload/multiple",
        method: "POST",
        body: data,
      }),
    }),
    
  }),
});

// Export hooks generated by the API service
export const {
    useAddFileMutation,
    useAddFilesMutation
} = filesApi;

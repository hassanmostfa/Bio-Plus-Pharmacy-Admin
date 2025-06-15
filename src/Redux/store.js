import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { BrandApi } from "api/brandSlice";
import { CategoryApi } from "api/categorySlice";
import { filesApi } from "api/filesSlice";
import { orderSlice } from "api/orderSlice";
import { pharmacyApi } from "api/pharmacySlice";
import { ProductApi } from "api/productSlice";
import { PromocodeApi } from "api/promocodeSlice";
import { roleApi } from "api/roleSlice";
import { TypeApi } from "api/typeSlice";
import { apiService } from "api/userSlice";
import { VarientApi } from "api/varientSlice";
import { prescriptionApi } from "api/prescription";

// import { userApi, authReducer } from './userSlice';

export const store = configureStore({
  reducer: {
    [apiService.reducerPath]: apiService.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
    [pharmacyApi.reducerPath]: pharmacyApi.reducer,
    [orderSlice.reducerPath]: orderSlice.reducer,
    [ProductApi.reducerPath]: ProductApi.reducer,
    [CategoryApi.reducerPath]: CategoryApi.reducer,
    [BrandApi.reducerPath]: BrandApi.reducer,
    [VarientApi.reducerPath]: VarientApi.reducer,
    [filesApi.reducerPath]: filesApi.reducer,
    [TypeApi.reducerPath]: TypeApi.reducer,
    [PromocodeApi.reducerPath]: PromocodeApi.reducer,
    [prescriptionApi.reducerPath]: prescriptionApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      PromocodeApi.middleware,
      apiService.middleware,
      roleApi.middleware,
      pharmacyApi.middleware,
      orderSlice.middleware,
      ProductApi.middleware,
      CategoryApi.middleware,
      BrandApi.middleware,
      VarientApi.middleware,
      filesApi.middleware,
      TypeApi.middleware,
      prescriptionApi.middleware
    ),
});

// Optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// See `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch);

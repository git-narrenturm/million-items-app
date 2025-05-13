import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { appBaseUrl } from '../constants/main';
import { Items } from '../types/main';

export const itemsApi = createApi({
  reducerPath: 'itemsApi',
  baseQuery: fetchBaseQuery({ baseUrl: appBaseUrl }),
  tagTypes: ['Records', 'State'],
  endpoints: (builder) => ({
    getItems: builder.query<Items[], { search: string; offset: number; limit: number }>({
      query: ({ search, offset, limit }) => ({
        url: `/items`,
        params: { search, offset, limit },
      }),
    }),
    getState: builder.query<{ selected: number[]; order: number[] }, void>({
      query: () => `/state`,
    }),
    postSelection: builder.mutation<void, number[]>({
      query: (selected) => ({
        url: `/select`,
        method: 'POST',
        body: { selected },
      }),
    }),
    postSortOrder: builder.mutation<void, number[]>({
      query: (order) => ({
        url: `/sort`,
        method: 'POST',
        body: { order },
      }),
    }),
  }),
});

export const {
  useGetItemsQuery,
  useLazyGetItemsQuery,
  useGetStateQuery,
  usePostSelectionMutation,
  usePostSortOrderMutation,
} = itemsApi;

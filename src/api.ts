import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  tagTypes: [],
  baseQuery: fetchBaseQuery(),
  endpoints: (builder) => ({
    getRuRate: builder.query<any, void>({
      query: (params) => ({
        url: 'https://www.cbr-xml-daily.ru/daily_json.js',
      }),
    }),
  }),
});

export const {
  useGetRuRateQuery,
} = api;

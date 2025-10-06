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
    getMoexSecurity: builder.query<any, string>({
      query: (security) => ({
        url: `https://iss.moex.com/iss/engines/futures/markets/forts/securities/${security}.json?iss.only=marketdata`,
      }),
      transformResponse(data: any) {
        const marketData = data.marketdata.data[0];
        const columns = data.marketdata.columns;
        const lastIndex = columns.indexOf('LAST');
        const lastPrice = marketData[lastIndex];
        console.log(`Последняя цена для ${'sec'}: ${lastPrice}`);
        return lastPrice
      }
    })
  }),
});

export const {
  useGetRuRateQuery,
    useGetMoexSecurityQuery
} = api;

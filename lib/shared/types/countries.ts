export type CountryData = [string, number];

export type CountriesRankingResponseDTO = {
  body: CountryData[];
  uniqueFilmsCount: number;
  status: string;
};

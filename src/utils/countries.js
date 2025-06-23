import { Country, State } from 'country-state-city';

// Build countriesData dynamically
const countriesData = {};
const allCountries = Country.getAllCountries();

allCountries.forEach(country => {
  const states = State.getStatesOfCountry(country.isoCode);
  countriesData[country.name] = states.map(state => state.name);
});

export { countriesData };
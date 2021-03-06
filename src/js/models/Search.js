import axios from "axios";
import { key, proxy } from "../config.js";

export default class Search {
  constructor(query) {
    this.query = query;
  }

  async getResults() {
    try {
      const res = await axios(`${proxy}http://food2fork.com/api/search?key=${key}&q=${this.query}`);
      this.results = res.data.recipes;
    } catch (err) {
      console.log(err);
    }
  }
}
<template>
  <div class="panel panel-default">
    <div class="panel-heading">
      <template v-if="isIndex">
        <h3 class="panel-title">{{ UI.formatString(T.rankHeader,{count:length}) }}</h3>
      </template>
      <template v-else="">
        <h3 class="panel-title">{{ UI.formatString(T.rankRangeHeader,
        {lowCount:(page-1)*length+1,highCount:page*length}) }}</h3>
      </template>
    </div>
    <div class="panel-body"
         v-if="!isIndex">
      <label><omegaup-autocomplete class="form-control"
                            v-bind:init="el =&gt; UI.userTypeahead(el)"
                            v-model="searchedUsername"></omegaup-autocomplete></label>
                            <button class="btn btn-primary"
           type="button"
           v-on:click="onSubmit">{{ T.searchUser }}</button>
      <template v-if="page &gt; 1">
        <a class="prev"
                  v-bind:href="prevPageFilter">{{ T.wordsPrevPage }}</a> <span class="delimiter"
                  v-show="shouldShowNextPage">|</span>
      </template><a class="next"
           v-bind:href="nextPageFilter"
           v-show="shouldShowNextPage">{{ T.wordsNextPage }}</a>
      <template v-if="Object.keys(availableFilters).length &gt; 0">
        <select class="filter"
                  v-model="filter"
                  v-on:change="filterChange">
          <option value="">
            {{ T.wordsSelectFilter }}
          </option>
          <option v-bind:value="key"
                  v-for="(item,key,index) in availableFilters">
            {{ item }}
          </option>
        </select>
      </template>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>#</th>
          <th colspan="2">{{ T.wordsUser }}</th>
          <th class="numericColumn">{{ T.rankScore }}</th>
          <th class="numericColumn"
              v-if="!isIndex">{{ T.rankSolved }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="rank in ranking">
          <td>{{ rank.rank }}</td>
          <td><img height="11"
               v-bind:src="flagURL(rank)"
               v-bind:title="rank.country"
               v-if="rank.country"
               width="16"></td>
          <td class="forcebreaks forcebreaks-top-5"><strong><a v-bind:href=
          "`/profile/${rank.username}`">{{ rank.username }}</a></strong><span v-if=
          "rank.name == null || length == 5">&nbsp;</span> <span v-else=""><br>
          {{ rank.name }}</span></td>
          <td class="numericColumn">{{ rank.score }}</td>
          <td class="numericColumn"
              v-if="!isIndex">{{ rank.problemsSolvedUser }}</td>
        </tr>
      </tbody>
    </table>
    <div class="panel-footer">
      <template v-if="isIndex">
        <a href="/rank/">{{ T.rankViewFull }}</a>
      </template>
      <template v-else="">
        <template v-if="page &gt; 1">
          <a class="prev"
                    v-bind:href="prevPageFilter">{{ T.wordsPrevPage }}</a> <span class="delimiter"
                    v-show="shouldShowNextPage">|</span>
        </template><a class="next"
                  v-bind:href="nextPageFilter"
                  v-show="shouldShowNextPage">{{ T.wordsNextPage }}</a>
      </template>
    </div>
  </div>
</template>

<script>
import {T} from '../omegaup.js';
import UI from '../ui.js';
import {OmegaUp} from '../omegaup.js';
import Autocomplete from './Autocomplete.vue';

export default {
  props: {
    page: Number,
    length: Number,
    isIndex: Boolean,
    availableFilters: undefined,
    filter: String,
    ranking: Array,
    resultTotal: Number,
  },
  data: function() {
    return { T: T, UI: UI, searchedUsername: '', }
  },
  methods: {
    onSubmit: function() {
      window.location = `/profile/${encodeURIComponent(this.searchedUsername)}`;
    },

    filterChange: function() {
      // change url parameters with jquery
      // https://samaxes.com/2011/09/change-url-parameters-with-jquery/
      var queryParameters = {}, queryString = location.search.substring(1),
          re = /([^&=]+)=([^&]*)/g, m;
      while (m = re.exec(queryString)) {
        queryParameters[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
      }
      if (this.filter !== '') {
        queryParameters['filter'] = this.filter;
      } else {
        delete queryParameters['filter'];
      }
      const url = UI.buildURLQuery(queryParameters);
      window.location.search = url;
    },
    flagURL(rank) {
      if (!rank.country) return '';
      return `/media/flags/${rank.country.toLowerCase()}.png`;
    },
  },
  computed: {
    nextPageFilter: function() {
      if (this.filter)
        return `/rank?page=${this.page + 1}&filter=${encodeURIComponent(this.filter)}`;
      else
        return `/rank?page=${this.page + 1}`;
    },
    prevPageFilter: function() {
      if (this.filter)
        return `/rank?page=${this.page - 1}&filter=${encodeURIComponent(this.filter)}`;
      else
        return `/rank?page=${this.page - 1}`;
    },
    shouldShowNextPage: function() {
      return this.length * this.page < this.resultTotal;
    }
  },
  components: {
    'omegaup-autocomplete': Autocomplete,
  },
};
</script>
